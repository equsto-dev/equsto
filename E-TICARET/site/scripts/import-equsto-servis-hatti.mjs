#!/usr/bin/env node
/**
 * İnoksan Gastroline + Klasik Seri servis hatları → Equsto / market-reyon self-servis-hatti
 * Kaynak: tezgah veya market-reyon (INO-* / mevcut Equsto), görseller inoksan-web-index
 *
 *   node scripts/import-equsto-servis-hatti.mjs
 *   node scripts/import-equsto-servis-hatti.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { foldTr, slugify } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEZGAH_FILE = path.join(ROOT, "public/data/dept/tezgah.json");
const MARKET_FILE = path.join(ROOT, "public/data/dept/market-reyon.json");
const WEB_INDEX = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const INO_IMG_DIR = path.join(ROOT, "public/images/catalog/inoksan/web");
const OUT_IMG_DIR = path.join(ROOT, "public/images/catalog/equsto/servis-hatti");
const OUT_IMG_SUB = "images/catalog/equsto/servis-hatti";

const BRAND = "Equsto";
const BRAND_ID = "equsto";
const CATEGORY = "self-servis-hatti";
const CATEGORY_LABEL = "Self-Servis Hattı";
const TILE_ID = "self-servis";
const DEPT = "market-reyon";
const KAYNAK = "equsto-inoksan-servis-hatti";
const CAT_URLS = [
  "gastroline-standart-servis-hatti",
  "klasik-seri-servis-hatti",
];

const dryRun = process.argv.includes("--dry-run");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

function curlBin(url, dest) {
  if (dryRun || !url) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync("curl.exe", ["-sL", "--max-time", "60", "-H", `User-Agent: ${UA}`, "-o", dest, url], {
    stdio: "pipe",
  });
  return r.status === 0 && fs.existsSync(dest) && fs.statSync(dest).size > 2500;
}

function publishImage(srcAbs, inoSku) {
  const fileName = `${equstoSlug(inoSku)}.jpg`;
  const dest = path.join(OUT_IMG_DIR, fileName);
  if (!dryRun) {
    fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
    fs.copyFileSync(srcAbs, dest);
  }
  return `${OUT_IMG_SUB}/${fileName}`;
}

function baseCodeFromTitle(title) {
  const t = String(title || "").trim();
  const m = t.match(/^([A-Z]{2,4})\s*[\d/\-–]/i) || t.match(/^([A-Z]{2,4})\b/i);
  if (m) return m[1].toUpperCase();
  const m2 = t.match(/^([A-Z0-9]{2,6})/i);
  return m2 ? m2[1].replace(/[^A-Z0-9]/gi, "").toUpperCase() : "";
}

function skuFamily(sku) {
  const m = String(sku || "")
    .replace(/^INO-/i, "")
    .match(/^([A-Z]+)/i);
  return m ? m[1].toUpperCase() : "";
}

function inoCode(sku) {
  return String(sku || "")
    .replace(/^INO-/i, "")
    .trim()
    .toUpperCase();
}

function equstoSku(inoSku) {
  return `EQUSTO.${inoCode(inoSku)}`;
}

function equstoSlug(inoSku) {
  return `equsto-${slugify(inoCode(inoSku))}`;
}

function cleanName(name) {
  return String(name || "")
    .replace(/^İNOKSAN\s+/i, "")
    .replace(/^INOKSAN\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadTargetBases(webProducts) {
  return new Set(
    webProducts
      .filter((p) => p.catUrl && CAT_URLS.some((u) => p.catUrl.includes(u)))
      .map((p) => baseCodeFromTitle(p.title))
      .filter(Boolean),
  );
}

function buildWebByFamily(webProducts) {
  const map = new Map();
  for (const p of webProducts) {
    if (!p.catUrl || !CAT_URLS.some((u) => p.catUrl.includes(u))) continue;
    const fam = baseCodeFromTitle(p.title);
    if (fam && !map.has(fam)) map.set(fam, p);
  }
  return map;
}

function resolveImage(inoSku, webByFamily, existingRel) {
  const slugIno = slugify(inoSku);
  const candidates = [
    existingRel ? path.join(ROOT, "public", existingRel) : "",
    path.join(INO_IMG_DIR, `${slugIno}.jpg`),
    path.join(INO_IMG_DIR, `ino-${slugify(inoCode(inoSku))}.jpg`),
  ].filter(Boolean);

  for (const abs of candidates) {
    if (fs.existsSync(abs)) return publishImage(abs, inoSku);
  }

  const web = webByFamily.get(skuFamily(inoSku));
  const famSlug = web ? slugify(baseCodeFromTitle(web.title)) : slugify(skuFamily(inoSku));
  const famCandidates = [
    path.join(INO_IMG_DIR, `ino-${famSlug}.jpg`),
    path.join(INO_IMG_DIR, `${famSlug}.jpg`),
    path.join(INO_IMG_DIR, `ino-${slugify(inoCode(inoSku))}.jpg`),
  ];
  for (const abs of famCandidates) {
    if (fs.existsSync(abs)) return publishImage(abs, inoSku);
  }

  const cacheDest = path.join(INO_IMG_DIR, `ino-${famSlug}.jpg`);
  if (web?.imgs?.[0] && !fs.existsSync(cacheDest) && curlBin(web.imgs[0], cacheDest)) {
    return publishImage(cacheDest, inoSku);
  }
  if (web?.imgs?.[0] && !web.imgs[0].endsWith("/products/")) {
    const tmp = path.join(OUT_IMG_DIR, `.tmp-${equstoSlug(inoSku)}.jpg`);
    if (curlBin(web.imgs[0], tmp)) {
      const rel = publishImage(tmp, inoSku);
      if (!dryRun && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      return rel;
    }
  }

  // KBT vb. — aynı aile görseli (servis buzdolabı)
  const sibling = webByFamily.get("KBH") || webByFamily.get("KBK");
  if (sibling?.imgs?.[0]) {
    const tmp = path.join(OUT_IMG_DIR, `.tmp-${equstoSlug(inoSku)}.jpg`);
    if (curlBin(sibling.imgs[0], tmp)) {
      const rel = publishImage(tmp, inoSku);
      if (!dryRun && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      return rel;
    }
  }

  return existingRel || "";
}

function rewriteSpecs(specs, oldSku, newSku) {
  let s = String(specs || "");
  s = s.replaceAll(oldSku, newSku);
  s = s.replace(/Kaynak: İnoksan[^\n]*/gi, `Kaynak: Equsto katalog — ${CATEGORY_LABEL}`);
  s = s.replace(/Kategori: [^\n]+/g, `Kategori: ${CATEGORY_LABEL}`);
  s = s.replace(/Teknik Özellikler \(inoksan\.com\)/gi, "Teknik Özellikler");
  s = s.replace(/\nMarka: Equsto/g, "");
  if (!s.includes("Marka: Equsto")) s += "\nMarka: Equsto";
  return s;
}

function toEqustoRow(row, webByFamily) {
  const oldSku = sourceInoSku(row);
  const sku = equstoSku(oldSku);
  const slug = equstoSlug(oldSku);
  const imgRel = resolveImage(oldSku, webByFamily, row.images?.[0]);
  const web = webByFamily.get(skuFamily(oldSku));
  const baseName = row.brand === BRAND ? row.name : row.name;
  const name = cleanName(
    web?.title && !String(baseName).includes("—")
      ? `${inoCode(oldSku)} — ${cleanName(web.title)}`
      : baseName,
  );

  const keep = [
    "price",
    "teknik_ozellikler",
    "olculer",
    "olcu_etiket",
    "liste_fiyati",
    "liste_fiyati_eur",
    "alis_fiyati",
    "alis_fiyati_eur",
    "satis_fiyati_eur",
    "satis_eur_indirimli",
    "iskontolu_fiyat",
    "bayi_iskonto",
    "equsto_kar_oran",
    "para_birimi",
    "fiyat_kaynagi",
    "kaynak_fiyat_listesi",
    "kur_eur_try",
    "fiyat_tl_net",
    "fiyat_tl",
    "kdv_oran",
    "fiyat_bekleniyor",
    "vitrin_arka_plan",
  ];
  const out = {
    id: `${BRAND_ID}__${slug}`,
    dept: DEPT,
    category: CATEGORY,
    brand: BRAND,
    oem_brand: "İnoksan",
    name,
    sku,
    model: sku,
    urun_kodu: sku,
    stok_no: sku,
    tileId: TILE_ID,
    keywords: [
      BRAND,
      sku,
      inoCode(oldSku),
      CATEGORY,
      CATEGORY_LABEL,
      "Servis & Teşhir",
      "self-servis",
      "self servis",
      "servis hattı",
      "servis hatti",
      "standart servis",
      "gastroline",
      "klasik seri",
    ],
    specs: rewriteSpecs(row.specs, oldSku, sku),
    aciklama: `${name}\n\nKategori: ${CATEGORY_LABEL}`,
    images: imgRel ? [imgRel] : [],
    kaynak: KAYNAK,
    inoksan_kaynak_sku: oldSku,
    inoksan_web_id: web?.id || row.inoksan_web_id,
    inoksan_slug: web?.slug || row.inoksan_slug,
  };
  for (const k of keep) {
    if (row[k] !== undefined) out[k] = row[k];
  }
  out.specs = rewriteSpecs(out.specs, oldSku, sku);
  return out;
}

function isTargetRow(row, bases) {
  if (
    row?.brand === BRAND &&
    row?.inoksan_kaynak_sku &&
    (row?.kaynak === KAYNAK || row?.category === CATEGORY || row?.category === "standart-servis-hatti")
  ) {
    return bases.has(skuFamily(row.inoksan_kaynak_sku));
  }
  if (row?.brand !== "İnoksan") return false;
  const fam = skuFamily(row.sku);
  return fam && bases.has(fam);
}

function sourceInoSku(row) {
  return row.inoksan_kaynak_sku || row.sku;
}

function main() {
  if (!fs.existsSync(TEZGAH_FILE) && !fs.existsSync(MARKET_FILE)) {
    console.error("dept json yok");
    process.exit(1);
  }
  if (!fs.existsSync(WEB_INDEX)) {
    console.error("inoksan-web-index.json yok — önce fetch-inoksan-catalog.mjs --refresh-index");
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  const webProducts = index.products || [];
  const bases = loadTargetBases(webProducts);
  const webByFamily = buildWebByFamily(webProducts);

  const tezgah = fs.existsSync(TEZGAH_FILE)
    ? JSON.parse(fs.readFileSync(TEZGAH_FILE, "utf8"))
    : [];
  const market = fs.existsSync(MARKET_FILE)
    ? JSON.parse(fs.readFileSync(MARKET_FILE, "utf8"))
    : [];
  const catalog = [...tezgah, ...market];
  const targets = catalog.filter((r) => isTargetRow(r, bases));
  if (!targets.length) {
    console.error("[equsto-servis-hatti] eşleşen satır yok");
    process.exit(1);
  }

  const equstoRows = targets.map((r) => toEqustoRow(r, webByFamily));
  const equstoSkus = new Set(equstoRows.map((r) => r.sku));
  const removedSkus = new Set(targets.map((r) => r.sku));

  const newTezgah = tezgah.filter((r) => !removedSkus.has(r.sku) && !equstoSkus.has(r.sku));
  const newMarket = [
    ...market.filter((r) => !removedSkus.has(r.sku) && !equstoSkus.has(r.sku)),
    ...equstoRows,
  ];

  const imgOk = equstoRows.filter((r) => r.images?.length).length;
  console.log(
    `[equsto-servis-hatti] ${dryRun ? "DRY-RUN" : "OK"} | ${equstoRows.length} ürün | görsel: ${imgOk}/${equstoRows.length}`,
  );
  console.log(`  dept: ${DEPT} | kategori: ${CATEGORY} (${CATEGORY_LABEL})`);
  console.log(`  tezgah: ${tezgah.length} → ${newTezgah.length} | market-reyon: ${market.length} → ${newMarket.length}`);

  if (!dryRun) {
    fs.writeFileSync(TEZGAH_FILE, JSON.stringify(newTezgah), "utf8");
    fs.writeFileSync(MARKET_FILE, JSON.stringify(newMarket), "utf8");
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main();
