#!/usr/bin/env node
/**
 * Pimak katalog s.188-197 → tezgah + davlumbaz: Pimak marka + PIMAK kodları
 * Kaynak: PFOS/veri/pimak/p188-197-products.json + PDF görselleri
 *
 *   node scripts/import-equsto-p188-197.mjs
 *   node scripts/import-equsto-p188-197.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../../PFOS/veri/pimak/p188-197-products.json");
const SRC_IMG = path.resolve(ROOT, "../../PFOS/veri/pimak/media/pdf-p188-197");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/equsto");
const MANIFEST = path.join(ROOT, "public/data/equsto/manifest.json");

const PIMAK_BRAND = "Pimak";
const PIMAK_BRAND_ID = "pimak";
const PIMAK_KAYNAK = "pimak-katalog-pdf";
const LEGACY_KAYNAKLAR = new Set(["equsto-katalog-pdf", "equsto-pimak-pdf", "pimak-katalog-pdf"]);
const DEFAULT_DEPT = "tezgah";
const BAYI_ISKONTO = 0.47;
const ODEME_CARPANI = 0.53;
const KAR_ORAN = 0.05;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

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

/** s.195 kutu tip orta tip — kullanıcı onaylı PNG (beyaz arka plan). */
const ORTA_KUTU_IMG_SRC = path.resolve(ROOT, "../../PFOS/veri/pimak/media/manual/davlumbaz-orta-tip-kutu.png");
const ORTA_KUTU_IMG_REL = "images/catalog/equsto/davlumbaz-orta-tip-kutu.png";
const ORTA_FILTRESIZ_IMG_SRC = path.resolve(SRC_IMG, "p195-prod01.jpeg");
const ORTA_FILTRESIZ_IMG_REL = "images/catalog/equsto/davlumbaz-orta-tip-filtresiz.jpeg";
/** s.196 duvar tipi — kullanıcı onaylı manuel PNG. */
const DUVAR_FILTRELI_IMG_SRC = path.resolve(ROOT, "../../PFOS/veri/pimak/media/manual/davlumbaz-filtreli.png");
const DUVAR_FILTRELI_IMG_REL = "images/catalog/equsto/davlumbaz-filtreli.png";
const DUVAR_FILTRESIZ_IMG_SRC = path.resolve(ROOT, "../../PFOS/veri/pimak/media/manual/davlumbaz-filtresiz.png");
const DUVAR_FILTRESIZ_IMG_REL = "images/catalog/equsto/davlumbaz-filtresiz.png";

function isOrtaTipDavlumbaz(p) {
  const cat = String(p.category || "");
  return p.pdf_page === 195 || /orta-tip/i.test(cat);
}

function isDuvarTipiDavlumbaz(p) {
  const cat = String(p.category || "");
  return p.pdf_page === 196 || /duvar-tipi/i.test(cat);
}

function isFiltreliDavlumbaz(p) {
  if (!isDavlumbazProduct(p)) return false;
  const kod = String(p.urun_kodu || "");
  const aile = String(p.aile || "");
  return /\.(01|10)$/i.test(kod) || /filtreli/i.test(aile);
}

function isFiltresizDavlumbaz(p) {
  if (!isDavlumbazProduct(p)) return false;
  const kod = String(p.urun_kodu || "");
  const aile = String(p.aile || "");
  return /\.(11|00)$/i.test(kod) || /filtresiz/i.test(aile);
}

function copySharedImage(srcAbs, relPath) {
  const dest = path.join(ROOT, "public", relPath);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(srcAbs, dest);
  }
  return [relPath];
}

function copyImage(p, slug) {
  if (isOrtaTipDavlumbaz(p) && isFiltreliDavlumbaz(p) && fs.existsSync(ORTA_KUTU_IMG_SRC)) {
    return copySharedImage(ORTA_KUTU_IMG_SRC, ORTA_KUTU_IMG_REL);
  }
  if (isOrtaTipDavlumbaz(p) && isFiltresizDavlumbaz(p) && fs.existsSync(ORTA_FILTRESIZ_IMG_SRC)) {
    return copySharedImage(ORTA_FILTRESIZ_IMG_SRC, ORTA_FILTRESIZ_IMG_REL);
  }
  if (isDuvarTipiDavlumbaz(p) && isFiltreliDavlumbaz(p) && fs.existsSync(DUVAR_FILTRELI_IMG_SRC)) {
    return copySharedImage(DUVAR_FILTRELI_IMG_SRC, DUVAR_FILTRELI_IMG_REL);
  }
  if (isDuvarTipiDavlumbaz(p) && isFiltresizDavlumbaz(p) && fs.existsSync(DUVAR_FILTRESIZ_IMG_SRC)) {
    return copySharedImage(DUVAR_FILTRESIZ_IMG_SRC, DUVAR_FILTRESIZ_IMG_REL);
  }

  const rel = p.gorsel_yerel;
  if (!rel) return [];
  const src = path.resolve(ROOT, "../../PFOS/veri/pimak", rel);
  if (!fs.existsSync(src)) return [];
  const fileName = path.basename(src);
  const destDir = path.join(OUT_IMG, slug);
  const dest = path.join(destDir, fileName);
  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return [`images/catalog/equsto/${slug}/${fileName}`];
}

function pimakSku(kod) {
  return String(kod || "")
    .trim()
    .toUpperCase();
}

function equstoSku(kod) {
  return pimakSku(kod).replace(/^PIMAK\./i, "EQUSTO.");
}

function pimakSlug(kod) {
  const sku = pimakSku(kod);
  if (/^PIMAK\./i.test(sku)) {
    const tail = sku.replace(/^PIMAK\./i, "").replace(/\./g, "-").toLowerCase();
    return tail ? `pimak-${tail}` : slugify("pimak-urun");
  }
  return `pimak-${slugify(sku)}`;
}

function equstoSlug(kod) {
  const tail = pimakSku(kod)
    .replace(/^PIMAK\./i, "")
    .replace(/\./g, "-")
    .toLowerCase();
  return tail ? `equsto-${tail}` : slugify("equsto-urun");
}

/** Görsel klasörü — mevcut public/images/catalog/equsto/equsto-* yolları korunur */
function imageStorageSlug(kod) {
  return equstoSlug(kod);
}

function formatSpecs(p, px, { brand, sku, kaynakLabel }) {
  const lines = [
    p.baslik,
    "",
    ...(p.temel_ozellikler || []).map((t) => `• ${t}`),
    "",
    `Ürün kodu: ${sku}`,
    `Kategori: ${p.aile}`,
  ];
  if (p.ebat_mm) lines.push(`Ebat (mm): ${p.ebat_mm}`);
  if (p.agirlik_kg) lines.push(`Ağırlık (Kg): ${p.agirlik_kg}`);
  if (px) {
    lines.push(
      "",
      `Liste fiyatı (EUR): ${px.liste_fiyati_eur}`,
      `Bayi iskonto: %${px.iskonto_oran}`,
      `Equsto satış (EUR): ${px.satis_fiyati_eur} (+%${Math.round(KAR_ORAN * 100)} kar)`,
      `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    );
  }
  lines.push("", `Kaynak: ${kaynakLabel} s.${p.pdf_page}`, `Marka: ${brand}`);
  return lines.join("\n");
}

function isDavlumbazProduct(p) {
  const cat = String(p.category || "");
  const aile = String(p.aile || "");
  return (
    p.pdf_page === 195 ||
    p.pdf_page === 196 ||
    cat.includes("davlumbaz") ||
    /davlumbaz/i.test(aile)
  );
}

function deptFor(p) {
  if (isDavlumbazProduct(p)) return "davlumbaz";
  return DEFAULT_DEPT;
}

function isDavlumbazRow(r) {
  return (
    r?.pdf_page === 195 ||
    r?.pdf_page === 196 ||
    String(r?.category || "").includes("davlumbaz") ||
    /davlumbaz/i.test(String(r?.name || ""))
  );
}

function toRow(p, kur) {
  const dept = deptFor(p);
  const sku = pimakSku(p.urun_kodu);
  const slug = pimakSlug(p.urun_kodu);
  const liste = Number(p.liste_fiyati_eur) || 0;
  const px = liste > 0 ? pricingFromListe(liste, kur) : null;
  const images = copyImage(p, imageStorageSlug(p.urun_kodu));
  const id = `${PIMAK_BRAND_ID}__${slug}`;

  return {
    id,
    dept,
    category: p.category || "calisma-tezgahi",
    brand: PIMAK_BRAND,
    oem_brand: "Pimak",
    name: p.baslik,
    price: px?.price || "Teklif için iletişim",
    fiyat_bekleniyor: !px,
    specs: formatSpecs(p, px, {
      brand: PIMAK_BRAND,
      sku,
      kaynakLabel: "Pimak katalog 2026",
    }),
    aciklama: (p.temel_ozellikler || []).join("\n"),
    teknik_ozellikler: [
      ...(p.temel_ozellikler || []),
      p.ebat_mm ? `Ebat (mm): ${p.ebat_mm}` : "",
      p.agirlik_kg ? `Ağırlık (Kg): ${p.agirlik_kg}` : "",
      `Katalog sayfası: ${p.pdf_page}`,
    ].filter(Boolean),
    ...(p.olcu_etiket ? { olcu_etiket: p.olcu_etiket, olculer: p.olculer } : {}),
    images: images.length ? images : undefined,
    sku,
    model: sku,
    urun_kodu: sku,
    kaynak: PIMAK_KAYNAK,
    kaynak_url: "",
    pdf_page: p.pdf_page,
    linkKaynak: "",
    ...(px || {}),
    kaynak_fiyat_listesi: px ? PIMAK_KAYNAK : undefined,
    ...( /^PIMAK\./i.test(sku)
      ? { marka_kodu: "PIMAK", marka_urun_kodu: sku.replace(/^PIMAK\./i, "") }
      : {}),
  };
}

function isP188197ImportRow(r) {
  const k = String(r?.kaynak || "");
  if (LEGACY_KAYNAKLAR.has(k)) return true;
  if (String(r?.id || "").startsWith("equsto__equsto-")) return true;
  if (String(r?.id || "").startsWith("pimak__pimak-")) return true;
  if (r?.brand === PIMAK_BRAND && String(r?.id || "").includes("equsto-pimak")) return true;
  return false;
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Kaynak yok:", SRC);
    process.exit(1);
  }
  const products = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const rows = products.map((p) => toRow(p, kur));
  const priced = rows.filter((r) => !r.fiyat_bekleniyor).length;
  const imgOk = rows.filter((r) => r.images?.length).length;
  const byDept = rows.reduce((acc, r) => {
    (acc[r.dept] ||= []).push(r);
    return acc;
  }, {});

  const deptTotals = {};
  for (const dept of new Set([...Object.keys(byDept), DEFAULT_DEPT, "davlumbaz"])) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) {
      kept = JSON.parse(fs.readFileSync(file, "utf8")).filter(
        (r) => !isP188197ImportRow(r) && !(dept === DEFAULT_DEPT && isDavlumbazRow(r)),
      );
    }
    const add = byDept[dept] || [];
    const merged = [...kept, ...add];
    deptTotals[dept] = merged.length;
    if (!dryRun && (add.length || dept === DEFAULT_DEPT || dept === "davlumbaz")) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(merged), "utf8");
    }
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(
      MANIFEST,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          brand: PIMAK_BRAND,
          kaynak: PIMAK_KAYNAK,
          pdf_pages: "188-197",
          imported: rows.length,
          priced,
          with_image: imgOk,
          depts: Object.fromEntries(
            Object.entries(byDept).map(([d, list]) => [d, list.length]),
          ),
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  console.log("[equsto-p188-197]", dryRun ? "DRY-RUN" : "OK", rows.length, "ürün");
  console.log("  fiyatlı:", priced, "| görselli:", imgOk);
  for (const [d, list] of Object.entries(byDept)) {
    console.log(`  ${d}: +${list.length} (toplam ${deptTotals[d]})`);
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
