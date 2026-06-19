/** Urban Bar kutu/paket adedi — build script ile UI aynı mantık */

function parseQtyFromText(text) {
  const hay = String(text || "");
  if (!hay) return null;

  const patterns = [
    /\bcontains\s+(\d+)\s+glasses?\b/i,
    /\bbox\s+of\s+(\d+)\b/i,
    /\bpack\s+of\s+(\d+)\b/i,
    /\bset\s+of\s+(\d+)\b/i,
    /\bbox\s*(\d+)\b/i,
    /-\s*b(\d+)\s*$/i,
    /-b(\d+)$/i,
  ];

  for (const re of patterns) {
    const m = hay.match(re);
    const n = Number(m?.[1]);
    if (Number.isFinite(n) && n > 1) return Math.round(n);
  }
  return null;
}

export function parseUrbanBarPackQty(input = {}) {
  const fromName = parseQtyFromText(input.name);
  if (fromName) return fromName;

  const code = String(input.code || "").trim();
  const fromCode = parseQtyFromText(code) || parseQtyFromText(code.replace(/\s+/g, ""));
  if (fromCode) return fromCode;

  for (const f of input.features || []) {
    const n = parseQtyFromText(f);
    if (n) return n;
  }

  const fromDesc = parseQtyFromText(input.description);
  if (fromDesc) return fromDesc;

  for (const s of input.specifications || []) {
    const n = parseQtyFromText(`${s.key} ${s.value}`);
    if (n) return n;
  }

  return 1;
}

export function urbanBarUnitPricing(row) {
  const totalTl = Number(row.fiyat_tl);
  if (!Number.isFinite(totalTl) || totalTl <= 0) return null;
  const packQty = parseUrbanBarPackQty(row);
  const unitTl = Math.round(totalTl / packQty);
  return { packQty, totalTl, unitTl };
}
