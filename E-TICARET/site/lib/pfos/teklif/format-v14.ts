import { isTepsiKapasiteMetni, olcuMmFromSku } from "./olcu-mm";

/** v14 proforma — tarih ve teklif no biçimleri */

export function formatTarihTr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "").trim());
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return iso || "—";
}

export function yeniTeklifSayisi(prefix = "EQS"): string {
  const d = new Date();
  const y = d.getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${y}-${seq}`;
}

export function tlToEur(
  tl: number | null | undefined,
  eurTry: number | null | undefined,
): number | null {
  if (tl == null || !Number.isFinite(tl) || tl <= 0) return null;
  if (eurTry != null && eurTry > 0) {
    return Math.round((tl / eurTry) * 100) / 100;
  }
  return Math.round(tl * 100) / 100;
}

/** KDV dahil TL (mağaza fiyat_tl) → KDV hariç EUR birim */
export function tlKdvDahilToEurNet(
  tlKdvDahil: number | null | undefined,
  eurTry: number | null | undefined,
  kdvOran = 20,
): number | null {
  if (tlKdvDahil == null || !Number.isFinite(tlKdvDahil) || tlKdvDahil <= 0) {
    return null;
  }
  if (!(eurTry != null && eurTry > 0)) return null;
  const netTl = tlKdvDahil / (1 + kdvOran / 100);
  return Math.round((netTl / eurTry) * 100) / 100;
}

/** PFOS proforma birim EUR — önce katalog satış EUR, yoksa KDV hariç TL/kur */
export function birimEurFromEslesmis(
  u: {
    fiyat?: number | null;
    fiyatEur?: number | null;
    doviz?: string | null;
  } | null
  | undefined,
  eurTry: number | null | undefined,
  kdvOran = 20,
): number | null {
  if (!u) return null;
  const eur = Number(u.fiyatEur);
  if (Number.isFinite(eur) && eur > 0) {
    return Math.round(eur * 100) / 100;
  }
  const satisTl = Number((u as { satis_fiyati_tl?: number }).satis_fiyati_tl);
  if (satisTl > 0 && eurTry != null && eurTry > 0) {
    return Math.round((satisTl / eurTry) * 100) / 100;
  }
  if (u.doviz === "EUR" && Number(u.fiyat) > 0) {
    return Math.round(Number(u.fiyat) * 100) / 100;
  }
  return tlKdvDahilToEurNet(u.fiyat, eurTry, kdvOran);
}

/** W×D×H, 120*70*85, 90 kg/gün gibi fiziksel ölçü / kapasite metni */
const OLCU_BOYUT =
  /\d+(?:[.,]\d+)?\s*[*×xX]\s*\d+(?:[.,]\d+)?(?:\s*[*×xX]\s*\d+(?:[.,]\d+)?)?/;
const OLCU_KAPASITE = /\d+\s*kg\s*\/?\s*g[uü]n/i;

export function isOlcuMetni(value: string | undefined | null): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  if (isTepsiKapasiteMetni(s)) return false;
  if (OLCU_BOYUT.test(s)) return true;
  if (OLCU_KAPASITE.test(s)) return true;
  return false;
}

/** v14 Ölçü sütunu — SKU katalog ölçüsü (mm), sonra eşleşmiş ürün ölçüsü */
export function olcuForTeklifSatir(
  ...candidates: Array<string | null | undefined>
): string {
  for (const v of candidates) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (s === "—") continue;
    if (isTepsiKapasiteMetni(s)) continue;
    if (isOlcuMetni(s)) return s;
    // Katalogdan gelen hazır ölçü (ör. 550×545×530 mm, 10 GN 1/1)
    if (/[×x*]\s*\d/.test(s) && (/\bmm\b/i.test(s) || /\d+\s*gn\b/i.test(s))) return s;
  }
  return "—";
}

/** Stok kodundan ve eşleşmiş ürün alanlarından v14 Ölçü */
export function olcuForTeklifUrun(
  urun: { sku?: string | null; olcu?: string | null; model?: string | null } | null | undefined,
  notlar?: string | null,
): string {
  const referansOlcu = String(notlar ?? "")
    .replace(/^ölçü:\s*/i, "")
    .trim();
  return olcuForTeklifSatir(
    isOlcuMetni(referansOlcu) ? referansOlcu : null,
    urun?.olcu ?? null,
    olcuMmFromSku(urun?.sku),
    notlar,
    urun?.model,
  );
}

/** Proforma/tablo kW hücresi — değer yoksa veya 0 ise boş */
export function formatKwHucre(kw: number | null | undefined): string {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return "";
  return String(kw);
}

/** Excel hücresi — boş bırakılacaksa null */
export function kwHucreExcelValue(kw: number | null | undefined): number | null {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return null;
  return kw;
}
