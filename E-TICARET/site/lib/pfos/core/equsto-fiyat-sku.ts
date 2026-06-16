/** EQ.KCT02.09070 — istemci güvenli (fs yok). */

export function parseEqSku(
  sku: string | null | undefined,
): { kod: string; en: number; derinlik: number } | null {
  const m = String(sku ?? "")
    .trim()
    .match(/^EQ\.([A-Z0-9]+)\.(\d{3})(\d{2})$/i);
  if (!m) return null;
  return {
    kod: m[1].toUpperCase(),
    en: Number(m[2]),
    derinlik: Number(m[3]),
  };
}

export function isEqustoFiyatListesiSku(sku: string | null | undefined): boolean {
  return /^EQ\.[A-Z0-9]+\.\d{5}$/i.test(String(sku ?? "").trim());
}

/** EQ.KCT02.09070 → fiyat listesi görseli */
export function equstoFiyatListesiGorselRelFromSku(
  sku: string | null | undefined,
): string | null {
  const parsed = parseEqSku(sku);
  if (!parsed) return null;
  return `images/catalog/equsto/fiyat-listesi/${parsed.kod.toLowerCase()}/urun.png`;
}
