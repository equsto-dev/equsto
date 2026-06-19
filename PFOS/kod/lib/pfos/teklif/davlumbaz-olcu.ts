/** Tezgah modülü (G×70×85 cm) — davlumbaz ölçüsü değil */
export function isTezgahModulOlcu(olcu: string | null | undefined): boolean {
  const s = String(olcu ?? "").replace(/\s/g, "");
  const m = /^(\d+(?:[.,]\d+)?)\s*[*×xX]\s*(\d+(?:[.,]\d+)?)\s*[*×xX]\s*(\d+(?:[.,]\d+)?)/i.exec(
    s,
  );
  if (!m) return false;
  const d = Number(String(m[2]).replace(",", "."));
  const h = Number(String(m[3]).replace(",", "."));
  return d >= 65 && d <= 75 && h >= 80 && h <= 90;
}

function isDavlumbazKalem(isim: string, urunTipi?: string | null): boolean {
  if (/davlumbaz/i.test(String(isim ?? ""))) return true;
  const tip = String(urunTipi ?? "")
    .toLowerCase()
    .replace(/_/g, "-");
  return /^davlumbaz/.test(tip);
}

/**
 * Referans/teklif — davlumbaz satırına tezgah ölçüsü (120*70*85) yapışmışsa düzelt.
 * Duvar tipi: U×97×50 cm (referans Excel convention).
 */
export function sanitizeDavlumbazOlcu(
  isim: string,
  olcu: string | null | undefined,
  urunTipi?: string | null,
): string | null {
  const raw = String(olcu ?? "").trim();
  if (!raw || raw === "—") return raw || null;
  if (!isDavlumbazKalem(isim, urunTipi)) return raw;
  if (!isTezgahModulOlcu(raw)) return raw;

  const lenM = /^(\d+(?:[.,]\d+)?)\s*[*×xX]/i.exec(raw.replace(/\s/g, ""));
  if (lenM) {
    const len = Math.round(Number(String(lenM[1]).replace(",", ".")));
    if (len > 0) return `${len}*97*50`;
  }
  return "120*97*50";
}
