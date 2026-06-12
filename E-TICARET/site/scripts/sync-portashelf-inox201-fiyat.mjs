/**
 * Portashelf 4 katlı raf — INOX 304 / 304 LIGHT / 201 / 201 LIGHT liste fiyatları.
 * Satış = listenin %45'i (%55 iskonto). urunler.json + dept/istif + ekipmanlar.json.
 *
 *   node scripts/sync-portashelf-inox201-fiyat.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SATIS_ORAN = 0.45;
const ALT_KAT_DISPLAY = "KATLI RAFLAR · TIER SHELVING";
const KUR_EUR_TRY = 53.5921;
const KDV = 1.2;

/** [depth, width, height, INOX304, 304LIGHT, INOX201, 201LIGHT] — Yüksel 2025 liste EUR */
const CATALOG_4KAT = [
  [46, 91, 183, 488, 424, 372, 336],
  [46, 107, 183, 532, 464, 408, 356],
  [46, 122, 183, 560, 480, 432, 372],
  [46, 137, 183, 628, 536, 484, 416],
  [46, 152, 183, 680, 576, 516, 440],
  [46, 183, 183, 764, 632, 572, 492],
  [53, 91, 183, 528, 452, 408, 356],
  [53, 107, 183, 568, 480, 432, 376],
  [53, 122, 183, 672, 568, 508, 432],
  [53, 137, 183, 716, 620, 540, 460],
  [53, 152, 183, 768, 636, 580, 492],
  [53, 183, 183, 868, 744, 660, 568],
  [61, 91, 183, 588, 508, 440, 380],
  [61, 107, 183, 632, 544, 488, 416],
  [61, 122, 183, 724, 600, 540, 460],
  [61, 137, 183, 768, 636, 580, 492],
  [61, 152, 183, 832, 688, 632, 528],
  [61, 183, 183, 952, 776, 716, 584],
];

const VARIANTS = [
  {
    key: "304",
    label: "INOX 304",
    skuSuffix: "-304",
    idSuffix: "304",
    priceIdx: 3,
  },
  {
    key: "304L",
    label: "INOX 304 LIGHT",
    skuSuffix: "-304L",
    idSuffix: "304l",
    priceIdx: 4,
  },
  {
    key: "201",
    label: "INOX 201",
    skuSuffix: "-201",
    idSuffix: "201",
    priceIdx: 5,
  },
  {
    key: "201L",
    label: "INOX 201 LIGHT",
    skuSuffix: "",
    idSuffix: "201l",
    priceIdx: 6,
  },
];

function baseSku(d, w, h) {
  return `${d}-X-${w}-X-${h}`;
}

function displayName(d, w, h, materialLabel) {
  return `Portashelf 4 Katlı Raf ${materialLabel} ${d}×${w}×${h} cm`;
}

/** Tüm Portashelf katlı raflar — tek takım istif rafı görseli */
const PORTASHELF_304_GORSEL = "images/catalog/yuksel/portashelf-304-katli-raf.jpg";

function portashelfImageRel() {
  return PORTASHELF_304_GORSEL;
}

function buildRow(d, w, h, listeEur, variant) {
  const code = `${baseSku(d, w, h)}${variant.skuSuffix}`;
  const satisEur = Math.round(listeEur * SATIS_ORAN * 100) / 100;
  const fiyatTl = Math.round(satisEur * KUR_EUR_TRY);
  const fiyatTlKdv = Math.round(fiyatTl * KDV);
  const img = portashelfImageRel();
  const imgAbs = path.join(ROOT, "public/data", img);
  const fallback = PORTASHELF_304_GORSEL;
  const olcuMm = `${d}X${w}X${h}`;
  const olcuCm = `${d} X ${w} X ${h}`;
  const altKatInternal = `${ALT_KAT_DISPLAY} · ${variant.label}`;
  const name = displayName(d, w, h, variant.label);

  return {
    category: "istif-raflari",
    brand: "Portashelf",
    name,
    price: `₺${fiyatTl.toLocaleString("tr-TR")},00 + KDV\nKDV Dahil ₺${fiyatTlKdv.toLocaleString("tr-TR")},00`,
    specs: [
      name,
      "Kaynak: YÜKSEL YERLİ - 2025 · Portashelf",
      `Kategori: ${ALT_KAT_DISPLAY}`,
      `Malzeme: ${variant.label}`,
      `Kod: ${code}`,
      `Ölçü (cm): ${olcuCm}`,
      `Liste fiyatı (EUR): ${listeEur}`,
      `Equsto satış (%45 liste EUR): ${satisEur.toFixed(2)}`,
      `Kur: 1 EUR = ${KUR_EUR_TRY} TRY (KDV %20)`,
    ].join("\n"),
    images: [fs.existsSync(imgAbs) ? img : fallback],
    sku: code,
    model: code,
    tip_kodu: code.toLowerCase(),
    liste: "YÜKSEL YERLİ - 2025",
    kaynak: "yuksel-2025-yerli-pdf",
    kaynak_fiyat_listesi: "yuksel-2025-yerli-pdf",
    dept: "istif",
    alt_kategori: altKatInternal,
    seri: "4 KATLI RAF",
    fiyat_euro: listeEur,
    liste_fiyati_eur: listeEur,
    satis_eur_indirimli: satisEur,
    satis_eur_net: satisEur,
    iskonto_oran: 55,
    fiyat_tl: fiyatTl,
    olculer_net_mm: olcuMm,
    page: 7,
    equsto_folder: "istif/portashelf",
    id: `portashelf__${variant.idSuffix}__${d}x${w}x${h}`,
  };
}

const catalogRows = [];
for (const variant of VARIANTS) {
  for (const row of CATALOG_4KAT) {
    const [d, w, h] = row;
    catalogRows.push(buildRow(d, w, h, row[variant.priceIdx], variant));
  }
}

const bySku = new Map(catalogRows.map((r) => [r.sku.toLowerCase(), r]));

function isPortashelfKatliRafRow(row) {
  const text = `${row.alt_kategori ?? ""} ${row.name ?? ""} ${row.seri ?? ""}`;
  if (!/katli\s*raf|tier\s*shelving/i.test(text)) return false;
  const sku = String(row.sku ?? "").trim();
  return /^\d+-x-\d+-x-\d+(-304l?|-201)?$/i.test(sku);
}

function mergePortashelfIntoArray(arr, label) {
  let added = 0;
  let updated = 0;
  const out = [];
  const seen = new Set();
  for (const row of arr) {
    const s = String(row.sku ?? "").trim().toLowerCase();
    if (bySku.has(s)) {
      out.push({ ...row, ...bySku.get(s) });
      seen.add(s);
      updated++;
      continue;
    }
    if (isPortashelfKatliRafRow(row)) {
      continue;
    }
    if (/^8897\.|^7897\./i.test(row.sku ?? "") && /istif|raf/i.test(row.name ?? "")) {
      continue;
    }
    out.push(row);
  }
  for (const [s, row] of bySku) {
    if (!seen.has(s)) {
      out.push(row);
      added++;
    }
  }
  console.log(`[${label}] +${added} yeni, ${updated} güncellendi → ${out.length} satır`);
  return out;
}

const urunlerPath = path.join(
  ROOT,
  "public/data/fiyat-listeleri/yuksel/2025-yerli/istif/portashelf/urunler.json",
);
const urunler = JSON.parse(fs.readFileSync(urunlerPath, "utf8"));
const urunlerArr = Array.isArray(urunler) ? urunler : urunler.items ?? [];
const other = urunlerArr.filter((p) => !isPortashelfKatliRafRow(p));
const mergedUrunler = [...other, ...catalogRows];
fs.writeFileSync(urunlerPath, JSON.stringify(mergedUrunler, null, 2) + "\n", "utf8");
console.log("[urunler.json]", mergedUrunler.length, "ürün,", catalogRows.length, "katlı raf");

const istifPath = path.join(ROOT, "public/data/dept/istif.json");
const istif = JSON.parse(fs.readFileSync(istifPath, "utf8"));
const mergedIstif = mergePortashelfIntoArray(istif, "dept/istif.json");
fs.writeFileSync(istifPath, JSON.stringify(mergedIstif), "utf8");

const ekipPath = path.join(ROOT, "public/data/ekipmanlar.json");
const ekip = JSON.parse(fs.readFileSync(ekipPath, "utf8"));
const mergedEkip = mergePortashelfIntoArray(ekip, "ekipmanlar.json");
fs.writeFileSync(ekipPath, JSON.stringify(mergedEkip), "utf8");

const ARABA_LISTE_EUR = 358;
const copSatisEur = Math.round(ARABA_LISTE_EUR * SATIS_ORAN * 100) / 100;
const copFiyatTl = Math.round(copSatisEur * KUR_EUR_TRY);
const copImg = "images/catalog/yuksel/web/yuksel-yuvarlak-cop-arabasi_1.jpg";
const copImgAbs = path.join(ROOT, "public/data", copImg);

function patchCopArabasiRow(row) {
  if (String(row.sku ?? "").toUpperCase() !== "MB126X") return row;
  const fiyatTlKdv = Math.round(copFiyatTl * KDV);
  return {
    ...row,
    brand: "Portashelf",
    name: "Portashelf Paslanmaz Çöp Arabası MB126X",
    liste_fiyati_eur: ARABA_LISTE_EUR,
    satis_eur_indirimli: copSatisEur,
    satis_eur_net: copSatisEur,
    fiyat_tl: copFiyatTl,
    price: `₺${copFiyatTl.toLocaleString("tr-TR")},00 + KDV\nKDV Dahil ₺${fiyatTlKdv.toLocaleString("tr-TR")},00`,
    kaynak_fiyat_listesi: "yuksel-2025-yerli-pdf",
    images: fs.existsSync(copImgAbs)
      ? [copImg]
      : row.images?.length
        ? row.images
        : ["images/catalog/yuksel/web/yuksel-yuvarlak-cop-arabasi_1.jpg"],
  };
}

const arabaPath = path.join(ROOT, "public/data/dept/araba.json");
if (fs.existsSync(arabaPath)) {
  const araba = JSON.parse(fs.readFileSync(arabaPath, "utf8"));
  const patchedAraba = araba.map(patchCopArabasiRow);
  fs.writeFileSync(arabaPath, JSON.stringify(patchedAraba), "utf8");
}
const patchedEkip = mergedEkip.map(patchCopArabasiRow);
fs.writeFileSync(ekipPath, JSON.stringify(patchedEkip), "utf8");
console.log("[portashelf] MB126X çöp arabası satış EUR:", copSatisEur);

console.log("\n[sync-portashelf] tamam — örnekler:");
for (const sample of ["46-x-91-x-183-304", "46-x-91-x-183-304l", "46-x-91-x-183-201", "46-x-91-x-183"]) {
  const row = bySku.get(sample);
  if (row) {
    console.log(`  ${row.sku}: liste ${row.liste_fiyati_eur} EUR → satış ${row.satis_eur_indirimli} EUR`);
  }
}
