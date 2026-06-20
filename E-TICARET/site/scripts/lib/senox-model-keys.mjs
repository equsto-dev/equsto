/** Şenox katalog SKU ↔ PDF model eşlemesi */

export function normSenoxModelKey(s) {
  return String(s || "")
    .replace(/^118\./i, "")
    .replace(/\s+/g, "")
    .replace(/[._-]/g, "")
    .toUpperCase();
}

/** @param {{ sku?: string; model?: string; urun_kodu?: string; name?: string }} row */
export function senoxModelKeys(row) {
  const out = new Set();
  for (const raw of [row.model, row.sku, row.urun_kodu]) {
    if (!raw) continue;
    const s = String(raw).trim();
    out.add(normSenoxModelKey(s));
    out.add(normSenoxModelKey(s.replace(/^118\./i, "")));
  }
  const nameCode = String(row.name || "").match(/\b([A-Z]{1,4}[\-]?\d{2,4}[A-Z0-9\-]*)\b/i)?.[1];
  if (nameCode) out.add(normSenoxModelKey(nameCode));
  return [...out].filter(Boolean);
}
