/**
 * Portashelf 4 katlı raf — INOX 201 LIGHT liste fiyatları, satış = %45.
 * urunler.json + dept/istif + ekipmanlar.json günceller.
 *
 *   node scripts/sync-portashelf-inox201-fiyat.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SATIS_ORAN = 0.45;
const ALT_KAT_DISPLAY = "KATLI RAFLAR · TIER SHELVING";
const ALT_KAT_INTERNAL = "KATLI RAFLAR · TIER SHELVING · INOX 201 LIGHT";
const KUR_EUR_TRY = 53.5921;
const KDV = 1.2;

const INOX201_4KAT = [
  [46, 91, 183, 336],
  [46, 107, 183, 356],
  [46, 122, 183, 372],
  [46, 137, 183, 416],
  [46, 152, 183, 440],
  [46, 183, 183, 492],
  [53, 91, 183, 356],
  [53, 107, 183, 376],
  [53, 122, 183, 432],
  [53, 137, 183, 460],
  [53, 152, 183, 492],
  [53, 183, 183, 568],
  [61, 91, 183, 380],
  [61, 107, 183, 416],
  [61, 122, 183, 460],
  [61, 137, 183, 492],
  [61, 152, 183, 528],
  [61, 183, 183, 584],
];

function sku(d, w, h) {
  return `${d}-X-${w}-X-${h}`;
}

function displayName(d, w, h) {
  return `Portashelf 4 Katlı Raf ${d}×${w}×${h} cm`;
}

/** Tüm Portashelf katlı raflar — kanonik 304 kalite tel raf görseli */
const PORTASHELF_304_GORSEL = "images/catalog/yuksel/portashelf-304-katli-raf.jpg";

function portashelfImageRel() {
  return PORTASHELF_304_GORSEL;
}

function buildRow(d, w, h, listeEur) {
  const code = sku(d, w, h);
  const satisEur = Math.round(listeEur * SATIS_ORAN * 100) / 100;
  const fiyatTl = Math.round(satisEur * KUR_EUR_TRY);
  const fiyatTlKdv = Math.round(fiyatTl * KDV);
  const img = portashelfImageRel();
  const imgAbs = path.join(ROOT, "public/data", img);
  const fallback = PORTASHELF_304_GORSEL;
  const olcuMm = `${d}X${w}X${h}`;
  const olcuCm = `${d} X ${w} X ${h}`;

  return {
    category: "istif-raflari",
    brand: "Portashelf",
    name: displayName(d, w, h),
    price: `₺${fiyatTl.toLocaleString("tr-TR")},00 + KDV\nKDV Dahil ₺${fiyatTlKdv.toLocaleString("tr-TR")},00`,
    specs: [
      displayName(d, w, h),
      "Kaynak: YÜKSEL YERLİ - 2025 · Portashelf",
      `Kategori: ${ALT_KAT_DISPLAY}`,
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
    alt_kategori: ALT_KAT_INTERNAL,
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
    id: `portashelf__${d}x${w}x${h}`,
  };
}

const catalogRows = INOX201_4KAT.map(([d, w, h, eur]) => buildRow(d, w, h, eur));
const bySku = new Map(catalogRows.map((r) => [r.sku.toLowerCase(), r]));

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
const other = urunlerArr.filter(
  (p) =>
    !/katli\s*raf|tier\s*shelving/i.test(
      `${p.alt_kategori ?? ""} ${p.name ?? ""}`,
    ) || !/^\d+-x-/i.test(String(p.sku ?? "")),
);
const mergedUrunler = [...other, ...catalogRows];
fs.writeFileSync(urunlerPath, JSON.stringify(mergedUrunler, null, 2) + "\n", "utf8");
console.log("[urunler.json]", mergedUrunler.length, "ürün");

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

console.log("\n[sync-portashelf-inox201] tamam — örnek 46-X-152-X-183 satış EUR:",
  bySku.get("46-x-152-x-183")?.satis_eur_indirimli);
