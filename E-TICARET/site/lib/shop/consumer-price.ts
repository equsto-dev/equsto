/** Tüketici vitrin fiyat etiketi — TRY (gösterim: ₺… TL). */

export const CONSUMER_PRICE_SUFFIX = " TL";

export type ConsumerPriceRow = {
  fiyat_tl?: number | string | null;
  price?: string | null;
  fiyat_bekleniyor?: number | boolean | null;
};

function parseTrAmount(raw: string): number {
  const cleaned = String(raw || "")
    .replace(/₺/g, "")
    .replace(/\+?\s*KDV.*/gi, "")
    .replace(/KDV\s*dahil/gi, "")
    .trim()
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

export function extractKdvDahilFromPriceString(price: string | null | undefined): number {
  if (!price) return 0;
  const full = String(price);
  const dahil = full.match(/K\s*D\s*V\s*[Dd]ahil[^\d]*([\d.,]+)/i);
  if (dahil) {
    const v = parseTrAmount(dahil[1]);
    if (v > 0) return v;
  }
  const line0 = full.split("\n")[0] || "";
  if (/\+?\s*K\s*D\s*V/i.test(line0)) {
    const net = parseTrAmount(line0);
    if (net > 0) return Math.round(net * 1.2 * 100) / 100;
  }
  if (/KDV\s*dahil/i.test(line0)) return parseTrAmount(line0);
  return parseTrAmount(line0);
}

export function resolveKdvDahilTry(row: ConsumerPriceRow | null | undefined): number {
  if (!row) return 0;
  if (row.fiyat_bekleniyor) return 0;
  const fiyatTl = Number(row.fiyat_tl);
  if (Number.isFinite(fiyatTl) && fiyatTl > 0) {
    return Math.round(fiyatTl * 100) / 100;
  }
  return extractKdvDahilFromPriceString(row.price);
}

export function isQuoteOnlyConsumerPrice(row: ConsumerPriceRow | null | undefined): boolean {
  if (!row) return false;
  if (row.fiyat_bekleniyor) return true;
  return /teklif\s+için/i.test(String(row.price || ""));
}

export function formatConsumerPriceAmount(n: number): string {
  const formatted = n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₺${formatted}${CONSUMER_PRICE_SUFFIX}`;
}

/** Katalog satırındaki «KDV dahil» etiketini vitrin «TL» biçimine çevirir. */
export function normalizeConsumerPriceLabel(line: string): string {
  if (!line) return "";
  let s = String(line).trim();
  if (/KDV\s*dahil/i.test(s)) {
    return s.replace(/\s*KDV\s*dahil\s*/gi, CONSUMER_PRICE_SUFFIX);
  }
  if (/₺/.test(s) && !/\bTL\s*$/i.test(s)) {
    s = s + CONSUMER_PRICE_SUFFIX;
  }
  return s;
}

export function formatConsumerPriceTry(
  row: ConsumerPriceRow | null | undefined,
  opts?: { quoteLabel?: string },
): string {
  if (isQuoteOnlyConsumerPrice(row)) {
    return opts?.quoteLabel || "Teklif için iletişim";
  }
  const n = resolveKdvDahilTry(row);
  if (!(n > 0)) {
    const fallback = String(row?.price || "");
    if (/\+?\s*K\s*D\s*V/i.test(fallback)) {
      const v = extractKdvDahilFromPriceString(fallback);
      if (v > 0) return formatConsumerPriceAmount(v);
    }
    return normalizeConsumerPriceLabel(fallback.split("\n")[0] || "");
  }
  return formatConsumerPriceAmount(n);
}
