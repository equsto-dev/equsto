function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[×x]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDuvarRafiReferans(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (/basket\s*raf/.test(n)) return true;
  return /duvar\s*raf/.test(n) && !/davlumbaz/.test(n);
}

const OZTI_DUVAR_RAF_WIDTHS_CM = [100, 120, 140, 160, 190] as const;

function snapDuvarRafWidthCm(widthCm: number): number {
  let best: number = OZTI_DUVAR_RAF_WIDTHS_CM[0];
  for (const w of OZTI_DUVAR_RAF_WIDTHS_CM) {
    if (Math.abs(widthCm - w) < Math.abs(widthCm - best)) best = w;
    else if (Math.abs(widthCm - w) === Math.abs(widthCm - best) && w > best) best = w;
  }
  return best;
}

/** 140*30 veya 175*40*60 → en yakın 7897.{genişlik}30.30 (Öztiryakiler duvar rafı) */
export function oztiDuvarRafSkuFromOlcu(olcu: string): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const m = raw.match(/(\d{2,4})\s*[*xX×]\s*(\d{2,3})(?:\s*[*xX×]\s*(\d{2,3}))?/);
  if (!m) return null;
  const w = snapDuvarRafWidthCm(Number(m[1]));
  return `7897.${w}30.30`;
}

export { norm as duvarRafNorm };
