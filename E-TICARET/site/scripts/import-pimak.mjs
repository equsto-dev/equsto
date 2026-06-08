#!/usr/bin/env node
/**
 * PFOS/veri/pimak → public/data/dept/*.json + görseller
 * Fiyat: liste × 0,53 (bayi %47 iskonto) × 1,05 (%5 kar) → EUR; TCMB ile TL
 * Liste fiyatı yoksa fiyat_bekleniyor (Pimak sitesi "İletişim" döner).
 *
 *   node scripts/import-pimak.mjs
 *   node scripts/import-pimak.mjs --dry-run
 *
 * Opsiyonel liste: scripts/data/pimak-fiyat.json
 *   { "M003R": { "liste_fiyati_eur": 1200 }, ... }
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { foldTr, slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_MANIFEST = path.resolve(ROOT, "../../PFOS/veri/pimak/products-tr.json");
const SRC_PAGES = path.resolve(ROOT, "../../PFOS/veri/pimak/urun-sayfalari");
const SRC_MEDIA = path.resolve(ROOT, "../../PFOS/veri/pimak/media/images");
const SRC_MANUEL = path.resolve(ROOT, "../../PFOS/veri/pimak/manuel");
const PRICE_FILE = path.join(ROOT, "scripts/data/pimak-fiyat.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/pimak");
const MANIFEST = path.join(ROOT, "public/data/pimak/manifest.json");

const BRAND = "Pimak";
const BRAND_ID = "pimak";
const KAYNAK = "pimak";
const BAYI_ISKONTO = 0.47;
const ODEME_CARPANI = 0.53;
const KAR_ORAN = 0.05;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

const KAFETERYA_KAT = new Set(["kafeterya-ekipmanlari", "kumpir-firini"]);
const HAZIRLIK_KAT = new Set([
  "endustriyel-kiyma-makinesi",
  "makarna-haslama-makinesi",
  "hamur-yogurma-makinesi",
  "patates-dograma-makinesi",
  "endustriyel-mikser",
  "set-ustu-mutfak-ekipmanlari",
  "pastane-ekipmanlari",
  "humus-makinesi",
  "et-ve-kemik-testeresi",
  "doner-eti-acma-makinesi",
  "pisirme-ekipmanlari",
]);
const PILIC_KAT = new Set(["pilic-cevirme", "pilic-cevirme-makinesi"]);
const SERVIS_KAT = new Set(["servis-hatlari"]);
/** Pimak katalog s.180–185: Servis Hatları + Self Servis Üniteleri → Servis & Teşhir */
const SERVIS_TESHIR_KOD_RE = [
  /^E-SS37/i,
  /^BE\/?M037-/i,
  /^BE1\/M037-/i,
  /^M037-\dSE$/i,
  /^MX037-\d/i,
  /^PVK\d+/i,
];
const TEPSI_KAT = new Set(["tepsi-tasima-arabalari"]);
const UNSEKER_KAT = new Set(["un-ve-seker-arabalari"]);

function normKod(k) {
  return String(k || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

function loadManualProducts() {
  if (!fs.existsSync(SRC_MANUEL)) return [];
  const out = [];
  for (const file of fs.readdirSync(SRC_MANUEL).sort()) {
    if (!file.endsWith(".json")) continue;
    const raw = JSON.parse(fs.readFileSync(path.join(SRC_MANUEL, file), "utf8"));
    for (const p of raw.products || []) {
      if (p.slug && p.urunKodu) out.push(p);
    }
  }
  return out;
}

function loadPriceMap() {
  if (!fs.existsSync(PRICE_FILE)) return new Map();
  const raw = JSON.parse(fs.readFileSync(PRICE_FILE, "utf8"));
  const map = new Map();
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_")) continue;
    const n = normKod(k);
    const liste = Number(v?.liste_fiyati_eur ?? v?.liste_fiyati ?? v?.liste);
    if (n && liste > 0) map.set(n, liste);
  }
  return map;
}

function asciiKod(k) {
  return normKod(
    foldTr(String(k || ""))
      .replace(/İ/g, "I")
      .replace(/ı/g, "I"),
  );
}

function priceAliases(k) {
  const raw = String(k || "");
  const n = normKod(raw);
  const a = asciiKod(raw);
  const out = [n, a];
  if (n.startsWith("PI/")) out.push(n.slice(3));
  out.push(
    n.replace(/\//g, "-"),
    n.replace(/\./g, "-"),
    n.replace(/\./g, ""),
    n.replace(/\//g, ""),
    n.replace(/-/g, "."),
    a.replace(/\//g, "-"),
    a.replace(/\./g, "-"),
    a.replace(/-/g, "."),
  );
  const m = n.match(/^([A-Z]+\d+[A-Z0-9./+\-]*?)(?:[-/]([EGR]))$/i);
  if (m) out.push(normKod(m[1]), normKod(`${m[1]}-${m[2]}`));
  if (/^PTS\d{2}-D[Iİ]J[Iİ]TAL$/i.test(n) || /^PTS\d{2}-D[Iİ]J[Iİ]TAL$/i.test(a)) {
    const pts = (a || n).replace(/D[Iİ]J[Iİ]TAL/i, "DIGITAL");
    out.push(pts);
  }
  if (/FRN-SMK/i.test(raw) || n.startsWith("FRN-SMK") || a.startsWith("FRN-SMK")) {
    out.push("FRN-SMK.G", "FRN-SMK.K");
  }
  const mx = n.match(/^(MX037-\d+)/i);
  if (mx) out.push(mx[1].toUpperCase());
  return [...new Set(out.filter(Boolean))];
}

function lookupListe(priceMap, urunKodu) {
  for (const a of priceAliases(urunKodu)) {
    const v = priceMap.get(a);
    if (v > 0) return v;
  }
  return 0;
}

function isServisTeshirLine(d) {
  const kod = normKod(d.urunKodu || "");
  const ascii = asciiKod(d.urunKodu || "");
  for (const re of SERVIS_TESHIR_KOD_RE) {
    if (re.test(kod) || re.test(ascii)) return true;
  }
  return false;
}

function classifyBucket(d) {
  const kat = d.kategori?.slug || "";
  const hay = foldTr([d.baslik, d.slug, d.urunKodu, d.metaAciklama].join(" "));
  const kod = String(d.urunKodu || "");

  if (isServisTeshirLine(d)) return "selfservis";

  if (PILIC_KAT.has(kat) || (/pilic|pilic/.test(hay) && !/pizza|lahmacun/.test(hay)))
    return "pilic";
  if (KAFETERYA_KAT.has(kat) || /\b(tost|kumpir|krep|waffle|portatif-mini-firin)\b/.test(hay))
    return "kafeterya";
  if (HAZIRLIK_KAT.has(kat)) return "hazirlik";
  if (SERVIS_KAT.has(kat)) return "servis";
  if (
    TEPSI_KAT.has(kat) ||
    /^g\.(st|gn|md|ss)\./i.test(kod) ||
    /^g-(st|gn|md|ss)-/i.test(d.slug)
  )
    return "tepsi";
  if (
    UNSEKER_KAT.has(kat) ||
    /^fc-\d|^pdb-/i.test(kod) ||
    /un[\s-]?seker|seker[\s-]?un|unlu.*araba/.test(hay)
  )
    return "unseker";
  return null;
}

function mapDept(bucket) {
  if (bucket === "pilic") return "pisirme";
  if (bucket === "kafeterya") return "set-ustu-mutfak";
  if (bucket === "hazirlik") return "hazirlik";
  if (bucket === "selfservis") return "market-reyon";
  if (bucket === "servis") return "servis";
  if (bucket === "tepsi" || bucket === "unseker") return "araba";
  return "pisirme";
}

function mapCategory(d, bucket) {
  if (bucket === "selfservis") return "self-servis-hatti";
  const kat = d.kategori?.slug;
  if (kat) return kat.slice(0, 72);
  return `${bucket}-${slugify(d.baslik || d.slug || "pimak")}`.slice(0, 72);
}

function parseListeFromTable(d) {
  const rows = d.teknikDetaylar?.satirlar || [];
  for (const r of rows) {
    const raw = String(r.Fiyat ?? r.fiyat ?? "").trim();
    if (!raw || /iletisim|contact|sorunuz/i.test(raw)) continue;
    const m = raw.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*€?/);
    if (!m) continue;
    const val = Number(m[1].replace(",", "."));
    if (val > 0 && val < 500000) return val;
  }
  return null;
}

function fmtTry(n) {
  const v = Math.round(Number(n));
  const parts = v.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function pricingFromListe(listeEur, kur) {
  const alis = Math.round(listeEur * ODEME_CARPANI * 100) / 100;
  const satis = Math.round(alis * (1 + KAR_ORAN) * 100) / 100;
  const netTry = satis * kur;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    liste_fiyati_eur: listeEur,
    alis_fiyati_eur: alis,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    iskonto_oran: Math.round(BAYI_ISKONTO * 100),
    odeme_carpani: ODEME_CARPANI,
    equsto_kar_oran: KAR_ORAN,
    kur_eur_try: kur,
    fiyat_tl: Math.round(kdvDahil),
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_bekleniyor: false,
  };
}

function teknikLines(d) {
  const out = [];
  for (const t of d.temelOzellikler || []) {
    const s = String(t).replace(/\s+/g, " ").trim();
    if (s) out.push(s);
  }
  for (const r of d.teknikDetaylar?.satirlar || []) {
    for (const [k, v] of Object.entries(r)) {
      if (k.endsWith("_gorsel") || !v || k === "Fiyat") continue;
      const val = String(v).replace(/\s+/g, " ").trim();
      if (val && val.length < 200) out.push(`${k}: ${val}`);
    }
  }
  return out;
}

function formatSpecs(d, px, kod) {
  const lines = [d.baslik, "", d.temelOzelliklerMetin || d.metaAciklama || ""].filter(Boolean);
  if (px?.liste_fiyati_eur) {
    lines.push(
      "",
      `Liste fiyatı (EUR): ${px.liste_fiyati_eur}`,
      `Bayi iskonto: %${px.iskonto_oran} (ödeme oranı ${px.odeme_carpani})`,
      `Bayi net alış (EUR): ${px.alis_fiyati_eur}`,
      `Equsto satış (EUR): ${px.satis_fiyati_eur} (+%${Math.round(KAR_ORAN * 100)} kar)`,
      `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    );
  } else {
    lines.push("", "Liste fiyatı: Pimak fiyat listesi bekleniyor (sitede yayınlanmıyor).");
  }
  if (d.kaynak_notu) lines.push("", d.kaynak_notu);
  lines.push("", `Kaynak: Pimak (${kod})`, `Ürün sayfası: ${d.url || ""}`);
  return lines.join("\n");
}

function copyImage(d, slug) {
  const rel = [];
  const srcName =
    d.gorselYerel?.fileName ||
    (d.gorselYerel?.local ? path.basename(d.gorselYerel.local) : `${slug}.jpg`);
  const src = path.join(SRC_MEDIA, srcName);
  if (!fs.existsSync(src)) {
    const alt = path.join(SRC_MEDIA, `${slug}.jpg`);
    if (fs.existsSync(alt)) {
      if (!dryRun) {
        fs.mkdirSync(path.join(OUT_IMG, slug), { recursive: true });
        fs.copyFileSync(alt, path.join(OUT_IMG, slug, path.basename(alt)));
      }
      rel.push(`images/catalog/pimak/${slug}/${path.basename(alt)}`);
    }
    return rel;
  }
  const destDir = path.join(OUT_IMG, slug);
  const dest = path.join(destDir, srcName);
  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
  rel.push(`images/catalog/pimak/${slug}/${srcName}`);
  return rel;
}

function toRow(d, bucket, priceMap, kur) {
  const dept = mapDept(bucket);
  const category = mapCategory(d, bucket);
  const slug = d.slug;
  const kod = normKod(d.urunKodu || slug);
  const images = copyImage(d, slug);

  let liste =
    Number(d.liste_fiyati_eur) ||
    lookupListe(priceMap, d.urunKodu || kod) ||
    parseListeFromTable(d);
  let px = null;
  let price = "Teklif için iletişim";
  let fiyat_bekleniyor = true;
  if (liste > 0) {
    px = pricingFromListe(liste, kur);
    price = px.price;
    fiyat_bekleniyor = false;
  }

  const id = `${BRAND_ID}__${slug}`;
  const row = {
    id,
    dept,
    category,
    brand: BRAND,
    name: d.baslik || `Pimak ${kod}`,
    price,
    fiyat_bekleniyor,
    specs: formatSpecs(d, px, kod),
    aciklama: d.temelOzelliklerMetin || d.metaAciklama || "",
    teknik_ozellikler: teknikLines(d),
    images: images.length ? images : undefined,
    sku: d.urunKodu || kod,
    model: d.urunKodu || kod,
    urun_kodu: d.urunKodu || kod,
    kaynak: KAYNAK,
    kaynak_url: d.url || "",
    pimak_slug: slug,
    pimak_kategori: d.kategori?.slug || "",
    pimak_bucket: bucket,
    linkKaynak: d.url || "",
    ...(px || {}),
    kaynak_fiyat_listesi: px ? (d.liste_fiyati_eur ? "pimak-katalog" : "pimak-fiyat") : undefined,
    pimak_manuel: Boolean(d.kaynak_notu),
  };
  if (bucket === "selfservis") {
    row.tileId = "self-servis";
    row.keywords = [BRAND, kod, "self-servis", "self servis", "Servis & Teşhir", category].filter(Boolean);
  }
  return row;
}

function isPimakRow(r) {
  return (
    r &&
    (r.kaynak === KAYNAK || r.brand === BRAND || r.brand === "Pimak Profesyonel Mutfak")
  );
}

async function main() {
  if (!fs.existsSync(SRC_MANIFEST)) {
    console.error("Kaynak yok:", SRC_MANIFEST);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(SRC_MANIFEST, "utf8"));
  const priceMap = loadPriceMap();
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const byBucket = {};
  const byDept = new Map();
  let skipped = 0;
  let imgOk = 0;
  let priced = 0;

  const seenSlug = new Set();

  function ingest(d) {
    const bucket = classifyBucket(d);
    if (!bucket) return;
    if (seenSlug.has(d.slug)) return;
    seenSlug.add(d.slug);
    byBucket[bucket] = (byBucket[bucket] || 0) + 1;
    const row = toRow(d, bucket, priceMap, kur);
    if (row.images?.length) imgOk++;
    if (!row.fiyat_bekleniyor) priced++;
    if (!byDept.has(row.dept)) byDept.set(row.dept, []);
    byDept.get(row.dept).push(row);
  }

  for (const p of manifest.products || []) {
    const detailPath = path.join(SRC_PAGES, `${p.slug}.json`);
    if (!fs.existsSync(detailPath)) {
      skipped++;
      continue;
    }
    ingest(JSON.parse(fs.readFileSync(detailPath, "utf8")));
  }

  for (const d of loadManualProducts()) ingest(d);

  const stats = {};
  const touchedDepts = new Set();
  for (const [dept, rows] of byDept) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) {
      kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isPimakRow(r));
    }
    const merged = [...kept, ...rows];
    if (!dryRun) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(merged), "utf8");
    }
    touchedDepts.add(dept);
    stats[dept] = { added: rows.length, kept: kept.length, total: merged.length };
  }

  for (const file of fs.readdirSync(DEPT_DIR)) {
    if (!file.endsWith(".json")) continue;
    const dept = file.replace(/\.json$/, "");
    if (touchedDepts.has(dept)) continue;
    const fp = path.join(DEPT_DIR, file);
    const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!arr.some(isPimakRow)) continue;
    const cleaned = arr.filter((r) => !isPimakRow(r));
    if (!dryRun) fs.writeFileSync(fp, JSON.stringify(cleaned), "utf8");
    stats[dept] = {
      added: 0,
      kept: cleaned.length,
      total: cleaned.length,
      pimak_removed: arr.length - cleaned.length,
    };
  }

  const report = {
    generated: new Date().toISOString(),
    brand: BRAND,
    dryRun,
    kur_eur_try: kur,
    tcmb_fallback: tcmb.fallback || false,
    bayi_iskonto: BAYI_ISKONTO,
    odeme_carpani: ODEME_CARPANI,
    equsto_kar_oran: KAR_ORAN,
    buckets: byBucket,
    imported: Object.values(byBucket).reduce((a, b) => a + b, 0),
    with_image: imgOk,
    with_price: priced,
    without_price: Object.values(byBucket).reduce((a, b) => a + b, 0) - priced,
    price_file: fs.existsSync(PRICE_FILE) ? path.relative(ROOT, PRICE_FILE) : null,
    price_map_entries: priceMap.size,
    skipped_no_detail: skipped,
    manuel: loadManualProducts().length,
    depts: Object.fromEntries([...byDept.entries()].map(([d, r]) => [d, r.length])),
    note:
      "Pimak web sitesi ve 2026 fiyatsız katalogda liste fiyatı yok; fiyat için scripts/data/pimak-fiyat.json ekleyin.",
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(report, null, 2), "utf8");
  }

  console.log("[pimak-import]", dryRun ? "DRY-RUN" : "OK", report.imported, "ürün");
  console.log("  kova:", JSON.stringify(byBucket));
  console.log("  görselli:", imgOk, "| fiyatlı:", priced, "| fiyatsız:", report.without_price);
  for (const [d, s] of Object.entries(stats).sort((a, b) => b[1].added - a[1].added)) {
    console.log(`  ${d}: +${s.added} (toplam ${s.total})`);
  }

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
