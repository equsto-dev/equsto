/**
 * Vitrin fiyat güveni — site fiyatı bilinen piyasa referansına göre.
 * Çok ucuz yayınlanan fiyat hem güven kaybı hem yanlış sipariş riskidir.
 */
export const PRICE_TRUST = {
  TOO_CHEAP: 0.45,
  TOO_EXPENSIVE: 2.5,
  MIN_MARKET_TL: 500,
  CAFE_MULT: 0.93,
  MUTBEX_MULT: 0.84,
  HAVALE: 0.02,
  KDV: 0.2,
};

export function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function skuOf(row) {
  return String(row?.sku || row?.model || row?.urun_kodu || row?.stok_no || "").trim();
}

/** 1M.0830.03216.01 / 083.0830.03216.01 → 0830.03216.01 */
export function normSku(raw) {
  let k = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!k) return "";
  k = k.replace(/^1M\./, "");
  if (/^\d{2,3}\.\d{4}\./.test(k)) k = k.replace(/^\d{2,3}\./, "");
  return k;
}

export function median(values) {
  const arr = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!arr.length) return 0;
  return arr[Math.floor(arr.length / 2)];
}

/**
 * Cafemarkt ile Mutbex 2×'den fazla ayrışırsa Cafemarkt (yanlış PLP fiyatı) düşer.
 * @param {{ cafemarkt?: number, mutbex?: number, other?: number[] }} markets
 */
export function reconcileMarkets(markets) {
  const cafe = num(markets?.cafemarkt);
  const mut = num(markets?.mutbex);
  const other = Array.isArray(markets?.other) ? markets.other : [];
  if (cafe >= PRICE_TRUST.MIN_MARKET_TL && mut >= PRICE_TRUST.MIN_MARKET_TL) {
    const spread = Math.max(cafe, mut) / Math.min(cafe, mut);
    if (spread > 2) {
      return { cafemarkt: 0, mutbex: mut, other, conflict: true };
    }
  }
  return { cafemarkt: cafe, mutbex: mut, other, conflict: false };
}

export function marketsAgree(markets) {
  const rec = reconcileMarkets(markets);
  return (
    !rec.conflict &&
    rec.cafemarkt >= PRICE_TRUST.MIN_MARKET_TL &&
    rec.mutbex >= PRICE_TRUST.MIN_MARKET_TL
  );
}

/**
 * @param {{ cafemarkt?: number, mutbex?: number, other?: number[] }} markets
 */
export function pickMarketRef(markets) {
  const rec = reconcileMarkets(markets);
  const cafe = rec.cafemarkt;
  const mut = rec.mutbex;
  const extra = rec.other.map((n) => num(n)).filter((n) => n >= PRICE_TRUST.MIN_MARKET_TL);
  if (cafe >= PRICE_TRUST.MIN_MARKET_TL) {
    return { tl: Math.round(cafe), source: "cafemarkt" };
  }
  if (mut >= PRICE_TRUST.MIN_MARKET_TL) {
    return { tl: Math.round(mut), source: "mutbex" };
  }
  const mid = median(extra);
  if (mid >= PRICE_TRUST.MIN_MARKET_TL) {
    return { tl: Math.round(mid), source: "other" };
  }
  return { tl: 0, source: "" };
}

/**
 * Equsto satış önerisi: Cafemarkt −%7, yoksa Mutbex medyan bandı (−%16).
 * @param {{ cafemarkt?: number, mutbex?: number }} markets
 */
export function suggestedSaleTl(markets) {
  const rec = reconcileMarkets(markets);
  const cafe = rec.cafemarkt;
  if (cafe >= PRICE_TRUST.MIN_MARKET_TL) {
    return Math.round(cafe * PRICE_TRUST.CAFE_MULT);
  }
  const mut = rec.mutbex;
  if (mut >= PRICE_TRUST.MIN_MARKET_TL) {
    return Math.round(mut * PRICE_TRUST.MUTBEX_MULT);
  }
  return 0;
}

/**
 * @param {{
 *   siteTl?: number,
 *   markets?: { cafemarkt?: number, mutbex?: number, other?: number[] },
 *   quoteOnly?: boolean,
 *   locked?: boolean,
 *   fiyatGuven?: boolean | null,
 * }} input
 */
export function evaluatePriceTrust(input) {
  const siteTl = num(input?.siteTl);
  const quoteOnly = !!input?.quoteOnly;
  const locked = !!input?.locked;
  if (input?.fiyatGuven === false) {
    return {
      trusted: false,
      publishable: false,
      reason: "flagged",
      severity: "critical",
      ratio: null,
      marketTl: 0,
      marketSource: "",
      suggestedTl: 0,
    };
  }
  const ref = pickMarketRef(input?.markets || {});
  const suggestedTl = suggestedSaleTl(input?.markets || {});
  if (!(ref.tl >= PRICE_TRUST.MIN_MARKET_TL)) {
    return {
      trusted: siteTl > 0 && !quoteOnly,
      publishable: siteTl > 0 && !quoteOnly,
      reason: quoteOnly ? "quote_only" : siteTl > 0 ? "no_market_ref" : "no_price",
      severity: "info",
      ratio: null,
      marketTl: 0,
      marketSource: "",
      suggestedTl: 0,
    };
  }
  if (quoteOnly) {
    return {
      trusted: false,
      publishable: false,
      reason: "quote_only",
      severity: "info",
      ratio: siteTl > 0 ? siteTl / ref.tl : null,
      marketTl: ref.tl,
      marketSource: ref.source,
      suggestedTl,
    };
  }
  if (!(siteTl > 0)) {
    return {
      trusted: false,
      publishable: false,
      reason: "no_price",
      severity: "high",
      ratio: null,
      marketTl: ref.tl,
      marketSource: ref.source,
      suggestedTl,
    };
  }
  const ratio = siteTl / ref.tl;
  if (ratio < PRICE_TRUST.TOO_CHEAP) {
    return {
      trusted: false,
      publishable: false,
      reason: "too_cheap",
      severity: "critical",
      ratio,
      marketTl: ref.tl,
      marketSource: ref.source,
      suggestedTl,
    };
  }
  if (ratio > PRICE_TRUST.TOO_EXPENSIVE) {
    return {
      trusted: false,
      publishable: true,
      reason: "too_expensive",
      severity: "high",
      ratio,
      marketTl: ref.tl,
      marketSource: ref.source,
      suggestedTl: 0,
    };
  }
  return {
    trusted: true,
    publishable: true,
    reason: locked ? "locked_ok" : "ok",
    severity: "info",
    ratio,
    marketTl: ref.tl,
    marketSource: ref.source,
    suggestedTl,
  };
}

export function isUntrustedPublishedPrice(row) {
  if (!row) return false;
  if (row.fiyat_bekleniyor) return false;
  if (row.fiyat_guven === false) return true;
  if (row.fiyat_kilit) return false;
  const market = num(row.piyasa_ref_tl);
  const site = num(row.fiyat_tl);
  if (market >= PRICE_TRUST.MIN_MARKET_TL && site > 0 && site / market < PRICE_TRUST.TOO_CHEAP) {
    return true;
  }
  return false;
}

export function fmtTry(n) {
  return `₺${Math.round(num(n)).toLocaleString("tr-TR")},00`;
}

export function netFromKdvDahil(kdvDahil, kdv = PRICE_TRUST.KDV) {
  return Math.round(num(kdvDahil) / (1 + kdv));
}

export function havaleFromKdvDahil(kdvDahil, pct = PRICE_TRUST.HAVALE) {
  return Math.round(num(kdvDahil) * (1 - pct));
}
