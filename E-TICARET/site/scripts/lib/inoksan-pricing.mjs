/**
 * İnoksan fiyatlandırma — liste × 0,815 × %15 kar → TL (KDV dahil)
 * İnoksan 2026 Yurtiçi Bayi Fiyatları R1: %18,5 iskonto (listenin %81,5'i)
 * sync-inoksan-fiyat-2026.py ile aynı sabitler.
 */

export const INOKSAN_KDV_ORAN = 20;
export const INOKSAN_KAR_ORAN = 1.15;
/** Tüm İnoksan: %18,5 bayi iskonto (ödeme oranı 0,815) */
export const INOKSAN_BAYI_ORAN = 0.815;
export const INOKSAN_ISKONTO = 0.185;
export const INOKSAN_KAYNAK = "inoksan-fiyat-listesi-2026-r1";
export const INOKSAN_BRAND = "İnoksan";

export function isInoksanRow(row) {
  if (!row) return false;
  return (
    row.brand === INOKSAN_BRAND ||
    String(row.id || "").startsWith("inoksan__") ||
    row.kaynak_fiyat_listesi === INOKSAN_KAYNAK ||
    row.kaynak === INOKSAN_KAYNAK
  );
}

export function inoksanBayiRates() {
  return { bayi: INOKSAN_BAYI_ORAN, iskonto: INOKSAN_ISKONTO };
}

export function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00`;
}

/**
 * @param {object} opts
 * @param {number} opts.listeEur
 * @param {string} opts.sku
 * @param {string} opts.shortName
 * @param {string} opts.catLabel
 * @param {number} opts.kurEurTry
 */
export function inoksanPricingFields(opts) {
  const { listeEur, sku, shortName, catLabel, kurEurTry } = opts;
  const liste = Math.round(Number(listeEur) * 100) / 100;
  const bayi = INOKSAN_BAYI_ORAN;
  const iskonto = INOKSAN_ISKONTO;
  const iskontoYuzde = Math.round(iskonto * 1000) / 10;
  const alis = Math.round(liste * bayi * 100) / 100;
  const satis = Math.round(alis * INOKSAN_KAR_ORAN * 100) / 100;
  const fiyatTlNet = Math.round(satis * kurEurTry);
  const fiyatTl = Math.round(fiyatTlNet * (1 + INOKSAN_KDV_ORAN / 100));
  const price = `${fmtTry(fiyatTl)} KDV dahil`;
  const title = String(shortName || sku).trim();
  const pricingBlock = [
    title,
    "",
    `Ürün kodu: ${sku}`,
    `Liste fiyatı (EUR): ${liste}`,
    `Bayi iskonto: %${iskontoYuzde} (ödeme oranı ${bayi})`,
    `Bayi net alış (EUR): ${alis}`,
    "Equsto kar: %15",
    `Equsto satış (EUR): ${satis}`,
    `Hesap: liste × ${bayi} × ${INOKSAN_KAR_ORAN}`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(fiyatTl)}`,
    `Kur: 1 EUR = ${kurEurTry} TRY (KDV %${INOKSAN_KDV_ORAN})`,
    `Kategori: ${catLabel}`,
    "Kaynak: İnoksan 2026 Yurtiçi Bayi Fiyatları R1",
  ].join("\n");

  return {
    price,
    pricingBlock,
    aciklama: `${title}\n\nKategori: ${catLabel}`,
    liste_fiyati: liste,
    liste_fiyati_eur: liste,
    alis_fiyati: alis,
    alis_fiyati_eur: alis,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    iskontolu_fiyat: satis,
    bayi_iskonto: iskonto,
    equsto_kar_oran: 0.15,
    para_birimi: "EUR",
    fiyat_kaynagi: INOKSAN_KAYNAK,
    kaynak: INOKSAN_KAYNAK,
    kaynak_fiyat_listesi: INOKSAN_KAYNAK,
    kur_eur_try: kurEurTry,
    fiyat_tl_net: fiyatTlNet,
    fiyat_tl: fiyatTl,
    kdv_oran: INOKSAN_KDV_ORAN,
    fiyat_bekleniyor: false,
  };
}

export function inoksanCatLabel(row) {
  const parts = [row.inoksan_h1, row.inoksan_h2, row.inoksan_h3].filter(Boolean);
  if (parts.length) return parts.join(" / ");
  return String(row.category || row.urun_kategori || "").replace(/-/g, " ");
}

export function inoksanShortName(row) {
  const raw = String(row.inoksan_excel_name || row.name || row.sku || "").trim();
  return raw.replace(/^İNOKSAN\s+/i, "").replace(/^INOKSAN\s+/i, "");
}

/** specs içindeki fiyat bloğunu günceller; ürün açıklaması korunur. */
export function mergeInoksanSpecs(row, pricingBlock) {
  const old = String(row.specs || "");
  const descIdx = old.search(/\n\nÜrün açıklaması\b/i);
  const suffix = descIdx >= 0 ? old.slice(descIdx) : "";
  return pricingBlock + suffix;
}

export function applyInoksanPricing(row, kurEurTry) {
  const liste = Number(row.liste_fiyati_eur || row.liste_fiyati || 0);
  if (!(liste > 0)) return false;

  const sku = String(row.sku || row.urun_kodu || "").trim();
  const px = inoksanPricingFields({
    listeEur: liste,
    sku,
    shortName: inoksanShortName(row),
    catLabel: inoksanCatLabel(row),
    kurEurTry,
  });

  row.price = px.price;
  row.specs = mergeInoksanSpecs(row, px.pricingBlock);
  row.aciklama = row.aciklama || px.aciklama;
  row.liste_fiyati = px.liste_fiyati;
  row.liste_fiyati_eur = px.liste_fiyati_eur;
  row.alis_fiyati = px.alis_fiyati;
  row.alis_fiyati_eur = px.alis_fiyati_eur;
  row.satis_fiyati_eur = px.satis_fiyati_eur;
  row.satis_eur_indirimli = px.satis_eur_indirimli;
  row.iskontolu_fiyat = px.iskontolu_fiyat;
  row.bayi_iskonto = px.bayi_iskonto;
  row.equsto_kar_oran = px.equsto_kar_oran;
  row.para_birimi = px.para_birimi;
  row.fiyat_kaynagi = px.fiyat_kaynagi;
  row.kaynak = px.kaynak;
  row.kaynak_fiyat_listesi = px.kaynak_fiyat_listesi;
  row.kur_eur_try = kurEurTry;
  row.fiyat_tl_net = px.fiyat_tl_net;
  row.fiyat_tl = px.fiyat_tl;
  row.kdv_oran = px.kdv_oran;
  row.fiyat_bekleniyor = false;
  return true;
}
