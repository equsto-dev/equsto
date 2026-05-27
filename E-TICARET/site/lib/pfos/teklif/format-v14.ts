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
  return olcuForTeklifSatir(
    olcuMmFromSku(urun?.sku),
    urun?.olcu ?? null,
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
