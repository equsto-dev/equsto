/** Tüketici vitrin fiyatı — KDV dahil TRY (besos hariç). */

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

export function formatConsumerPriceTry(
  row: ConsumerPriceRow | null | undefined,
  opts?: { quoteLabel?: string },
): string {
  if (isQuoteOnlyConsumerPrice(row)) {
    return opts?.quoteLabel || "Teklif için iletişim";
  }
  const n = resolveKdvDahilTry(row);
  if (!(n > 0)) {
    return String(row?.price || "").split("\n")[0] || "";
  }
  const formatted = n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₺${formatted} KDV dahil`;
}
