import type { SoruCevapHaritasi } from "@/lib/pfos/proje-akis/soru-motor-mapping";

/** Bulut mutfak ≤15 m² — yalnızca kompakt alt-konseptler (SEO GEO notu) */
export const BULUT_KOMPAKT_DUKKAN = new Set(["Grab&Go", "Coffee Counter"]);

export const BULUT_KOMPAKT_M2_MAX = 15;

export function bulutMutfakKompaktMi(answers: SoruCevapHaritasi): boolean {
  if (String(answers.q_ust_segment ?? "").trim() !== "Bulut Mutfak") {
    return false;
  }
  const m2 = Number(answers.q_m2);
  return Number.isFinite(m2) && m2 > 0 && m2 <= BULUT_KOMPAKT_M2_MAX;
}

export function filtreBulutDukkanSecenekleri(
  opts: string[],
  answers: SoruCevapHaritasi,
): string[] {
  if (!bulutMutfakKompaktMi(answers)) return opts;
  const filtered = opts.filter((o) => BULUT_KOMPAKT_DUKKAN.has(o));
  return filtered.length ? filtered : opts;
}

export function bulutDukkanGecerliMi(
  dukkan: string,
  answers: SoruCevapHaritasi,
): boolean {
  if (!bulutMutfakKompaktMi(answers)) return true;
  const d = dukkan.trim();
  if (!d) return true;
  return BULUT_KOMPAKT_DUKKAN.has(d);
}
