/** Vitrin fiyat güveni — scripts/lib/price-trust.mjs ile aynı eşikler. */

export const PRICE_TRUST_TOO_CHEAP = 0.45;
export const PRICE_TRUST_MIN_MARKET_TL = 500;

export type PriceTrustRow = {
  fiyat_tl?: number | string | null;
  fiyat_bekleniyor?: number | boolean | null;
  fiyat_guven?: boolean | null;
  fiyat_kilit?: boolean | null;
  piyasa_ref_tl?: number | string | null;
};

export function isUntrustedPublishedPrice(row: PriceTrustRow | null | undefined): boolean {
  if (!row) return false;
  if (row.fiyat_bekleniyor) return false;
  if (row.fiyat_guven === false) return true;
  if (row.fiyat_kilit) return false;
  const market = Number(row.piyasa_ref_tl);
  const site = Number(row.fiyat_tl);
  if (
    Number.isFinite(market) &&
    market >= PRICE_TRUST_MIN_MARKET_TL &&
    Number.isFinite(site) &&
    site > 0 &&
    site / market < PRICE_TRUST_TOO_CHEAP
  ) {
    return true;
  }
  return false;
}
