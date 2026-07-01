/** Admin tablo / etiket — obje ve kirli string güvenli metin */
export function pfosDisplayText(
  value: unknown,
  fallback = "—",
): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s || s === "[object Object]" || s.toLowerCase() === "nan") {
      return fallback;
    }
    return s;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const candidate =
      o.label ?? o.konseptLabel ?? o.konsept_label ?? o.name ?? o.ad ?? o.title;
    if (candidate != null) return pfosDisplayText(candidate, fallback);
    return fallback;
  }
  const s = String(value).trim();
  if (!s || s === "[object Object]") return fallback;
  return s;
}

/** 0–1 arası güven skoru → yüzde (NaN güvenli) */
export function pfosGuvenYuzde(
  skor: number | null | undefined,
): number | null {
  if (skor == null || !Number.isFinite(skor)) return null;
  return Math.round(skor * 100);
}

export function pfosGuvenYuzdeMetin(
  skor: number | null | undefined,
): string {
  const pct = pfosGuvenYuzde(skor);
  return pct != null ? `${pct}%` : "—";
}
