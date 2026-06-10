#!/usr/bin/env node
/**
 * PLP düzeltmesi: 3 ürün görsel + fiyat
 *   node scripts/patch-fix3-plp-products.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const ELX_DIR = path.join(ROOT, "public/images/catalog/electrolux/217891");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");

// COD 217891 has no Mirror asset; 217881 (ECOG62B2G0) is the same SkyLine Premium 6×2/1 GN gas combi oven.
const ELX_IMG_URL =
  "https://tools.electroluxprofessional.com/Mirror/Doc/PH_1000x1000/PH_217881_1_1_217881.jpg";
const ELX_IMG_REL = "images/catalog/electrolux/217891/hero-plp.jpg";

const KUR = 53.2979;
const KDV = 20;
const ELX_ISK = 48;
const ELX_SATIS_ORAN = 0.52;

function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00`;
}

function copyIf(srcName, destName) {
  const src = path.join(WEB, srcName);
  const dest = path.join(WEB, destName);
  if (!fs.existsSync(src)) throw new Error(`Kaynak yok: ${src}`);
  fs.copyFileSync(src, dest);
  console.log(`[img] ${srcName} → ${destName}`);
}

async function downloadElxHero() {
  fs.mkdirSync(ELX_DIR, { recursive: true });
  const dest = path.join(ROOT, "public", ELX_IMG_REL);
  const r = await fetch(ELX_IMG_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Equsto/1.0)" },
  });
  if (!r.ok) throw new Error(`Electrolux görsel indirilemedi: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 5000) throw new Error("Electrolux görsel çok küçük");
  fs.writeFileSync(dest, buf);
  console.log(`[img] electrolux 217891 hero-plp.jpg (${buf.length} B)`);
}

function elxPricing(liste) {
  const satis = Math.round(liste * ELX_SATIS_ORAN * 100) / 100;
  const fiyat_tl_net = Math.round(satis * KUR);
  const fiyat_tl = Math.round(fiyat_tl_net * (1 + KDV / 100));
  const pricingBlock = [
    `Ürün kodu (COD): 217891`,
    `Model: ECOG62B2G1`,
    `Liste fiyatı (EUR): ${liste}`,
    `Equsto iskonto: %${ELX_ISK}`,
    `Equsto satış (EUR): ${satis}`,
    `Hesap: liste × ${ELX_SATIS_ORAN}`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(fiyat_tl)}`,
    `Kur: 1 EUR = ${KUR} TRY (KDV %${KDV})`,
    `Kaynak: Electrolux Professional Fiyat Listesi 2025`,
  ].join("\n");
  return {
    price: `${fmtTry(fiyat_tl)} KDV dahil`,
    fiyat_tl,
    fiyat_tl_net,
    liste_fiyati: liste,
    liste_fiyati_eur: liste,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    iskontolu_fiyat: satis,
    iskonto_oran: ELX_ISK,
    iskonto_yuzde: ELX_ISK,
    kur_eur_try: KUR,
    kdv_oran: KDV,
    fiyat_kaynagi: "electrolux-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "electrolux-fiyat-listesi-2025",
    fiyat_bekleniyor: false,
    electrolux_liste_model: "ECOG62B2G1",
    _pricingBlock: pricingBlock,
  };
}

function mergeSpecs(old, pricingText) {
  const lines = String(old || "").split("\n");
  const out = [];
  let skip = false;
  for (const line of lines) {
    if (line.startsWith("Ürün kodu (COD):")) {
      skip = true;
      continue;
    }
    if (skip) {
      if (line.startsWith("Kaynak: Electrolux Professional Fiyat Listesi")) skip = false;
      continue;
    }
    out.push(line);
  }
  const body = out.join("\n").trim();
  return body ? `${body}\n\n${pricingText}` : pricingText;
}

function patchOzti52From54(rows) {
  const sib = rows.find((r) => r.id === "oztiryakiler-endustriyel-mutfak__7890-12908-54");
  const row = rows.find((r) => r.id === "oztiryakiler-endustriyel-mutfak__7890-12908-52");
  if (!sib || !row) return false;
  const priceKeys = [
    "price",
    "fiyat_tl",
    "fiyat_tl_net",
    "liste_fiyati",
    "liste_fiyati_eur",
    "alis_fiyati",
    "alis_fiyati_eur",
    "satis_fiyati_eur",
    "satis_eur_indirimli",
    "iskontolu_fiyat",
    "bayi_iskonto",
    "odeme_carpani",
    "kalan_oran",
    "iskonto_yuzde",
    "iskonto_oran",
    "equsto_kar_oran",
    "kur_eur_try",
    "kdv_oran",
    "para_birimi",
    "fiyat_kaynagi",
  ];
  for (const k of priceKeys) {
    if (sib[k] != null) row[k] = sib[k];
  }
  row.images = ["images/catalog/ozti/web/ozti-7890-12908-52.jpg"];
  const note =
    "Not: Fiyat listesinde yalnızca G/E model (7890.12908.54) yer alıyor; aynı OTKFGE 12090 tek katlı seri fiyatı uygulandı.";
  if (!String(row.specs || "").includes(note)) {
    row.specs = `${String(row.specs || "").trim()}\n\n${note}`;
  }
  console.log("[price] 7890.12908.52 ← kardeş SKU .54");
  return true;
}

async function main() {
  copyIf("ozti-7865-n1-12908-10.jpg", "ozti-7865-n1-12708-12l.jpg");
  copyIf("ozti-7890-12908-54.jpg", "ozti-7890-12908-52.jpg");
  await downloadElxHero();

  const rows = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
  let n = 0;

  const kuz = rows.find((r) => r.id === "oztiryakiler-endustriyel-mutfak__7865-n1-12708-12l");
  if (kuz) {
    kuz.images = ["images/catalog/ozti/web/ozti-7865-n1-12708-12l.jpg"];
    n++;
    console.log("[img] kuzine 7865.N1.12708.12L");
  }

  if (patchOzti52From54(rows)) n++;

  const elx = rows.find((r) => r.id === "electrolux-professional__217891");
  if (elx) {
    const liste = Number(elx.liste_fiyati_eur) || 17972;
    const px = elxPricing(liste);
    const pricingText = px._pricingBlock;
    delete px._pricingBlock;
    Object.assign(elx, px);
    elx.specs = mergeSpecs(elx.specs, pricingText);
    elx.images = [ELX_IMG_REL];
    n++;
    console.log(`[price] electrolux 217891 → ${elx.price}`);
  }

  fs.writeFileSync(PISIRME, JSON.stringify(rows, null, 0), "utf8");
  console.log(`[pisirme.json] ${n} ürün güncellendi`);

  const rb = spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rb.status !== 0) process.exit(rb.status || 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
