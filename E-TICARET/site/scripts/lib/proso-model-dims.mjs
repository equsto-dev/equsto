/**
 * Proso model kodundan derinlik / yükseklik (mm).
 * Uzunluk (genislik_mm) varyant ekseninde ayrı tutulur.
 */

function cmToMm(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v >= 400) return Math.round(v);
  if (v >= 40 && v <= 260) return Math.round(v * 10);
  return Math.round(v);
}

export function parseProsoModelKodDims(modelKod) {
  const kod = String(modelKod || "").replace(/\s+/g, " ").trim();
  if (!kod) return { derinlik_mm: 0, yukseklik_mm: 0 };

  // CRAB 800/1050, SPIDER 800/1050
  let m = kod.match(/\b(\d{3,4})\s*\/\s*(\d{3,4})\s*$/);
  if (m && Number(m[1]) >= 800 && Number(m[2]) >= 800) {
    return { derinlik_mm: Number(m[1]), yukseklik_mm: Number(m[2]) };
  }

  // DP/SLD/100/150, DP/100/150, PR/CG/75/130
  m = kod.match(/\/(\d{2,3})\s*\/\s*(\d{2,3})(?:\s|$|[A-Z])/i);
  if (m) {
    const d = cmToMm(m[1]);
    const h = cmToMm(m[2]);
    if (d && h) return { derinlik_mm: d, yukseklik_mm: h };
  }

  // DP 75/205 DGD, BUTTERFLY BM 75/130, PHOENIX DP 75/140
  m = kod.match(/\b(?:DP|MT|PR|PN|BR|BM|HP|SB|SP|BA)\s+(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (m) {
    const d = cmToMm(m[1]);
    const h = cmToMm(m[2]);
    if (d && h) return { derinlik_mm: d, yukseklik_mm: h };
  }

  // BUTTERFLY PR/CG/75/130
  m = kod.match(/\/CG\/(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (m) {
    const d = cmToMm(m[1]);
    const h = cmToMm(m[2]);
    if (d && h) return { derinlik_mm: d, yukseklik_mm: h };
  }

  // RHINO 125/160, FOX 90/117, SCORPION 75/205
  m = kod.match(/\b(\d{2,3})\s*\/\s*(\d{2,3})\b/);
  if (m) {
    const d = cmToMm(m[1]);
    const h = cmToMm(m[2]);
    if (d >= 700 && h >= 1000) return { derinlik_mm: d, yukseklik_mm: h };
  }

  // TIGER 800 WFG/CB, LEOPARD 800 FG/CB, COBRA 800 FG/CB
  m = kod.match(/\b(800|900)\s+(WFG|FG|CG|IFG|DP)(?:\/[A-Z-]+)?/i);
  if (m) {
    const depth = Number(m[1]);
    const height = depth === 900 ? 1300 : 1250;
    return { derinlik_mm: depth, yukseklik_mm: height };
  }

  return { derinlik_mm: 0, yukseklik_mm: 0 };
}

export function applyProsoModelKodDims(variant) {
  if (!variant) return variant;
  const d = Number(variant.derinlik_mm) || 0;
  const h = Number(variant.yukseklik_mm) || 0;
  if (d > 0 && h > 0) return variant;
  const fromKod = parseProsoModelKodDims(variant.modelKod);
  return {
    ...variant,
    derinlik_mm: d || fromKod.derinlik_mm || 0,
    yukseklik_mm: h || fromKod.yukseklik_mm || 0,
  };
}

export function enrichProsoOlculer(olculer, modelKod) {
  const o = { ...(olculer || {}) };
  const d = Number(o.derinlik_mm) || 0;
  const h = Number(o.yukseklik_mm) || 0;
  if (d > 0 && h > 0) return o;
  const fromKod = parseProsoModelKodDims(modelKod);
  if (!d && fromKod.derinlik_mm) o.derinlik_mm = fromKod.derinlik_mm;
  if (!h && fromKod.yukseklik_mm) o.yukseklik_mm = fromKod.yukseklik_mm;
  return o;
}
