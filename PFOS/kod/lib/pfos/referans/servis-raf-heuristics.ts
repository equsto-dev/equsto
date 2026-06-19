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

/** Paslanmaz çelik servis rafı — araba / banko / ünite hariç */
export function isServisRafiReferans(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!/servis\s*raf/.test(n)) return false;
  if (/arab|ünite|unite|banko|dolap|tezgah/.test(n)) return false;
  return true;
}

const OZTI_SERVIS_RAF_WIDTHS_CM = [120, 140, 150, 160, 190] as const;

function snapServisRafWidthCm(widthCm: number): number {
  let best: number = OZTI_SERVIS_RAF_WIDTHS_CM[0];
  for (const w of OZTI_SERVIS_RAF_WIDTHS_CM) {
    if (Math.abs(widthCm - w) < Math.abs(widthCm - best)) best = w;
    else if (Math.abs(widthCm - w) === Math.abs(widthCm - best) && w > best) best = w;
  }
  return best;
}

/** 186*40*60 → en yakın 7897.19030.03 (bombe camlı servis rafı) */
export function oztiServisRafSkuFromOlcu(
  olcu: string,
  isim?: string | null,
): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const m = raw.match(/(\d{2,4})\s*[*xX×]\s*(\d{2,3})(?:\s*[*xX×]\s*(\d{2,3}))?/);
  if (!m) return null;
  const w = snapServisRafWidthCm(Number(m[1]));
  const n = norm(isim ?? "");
  const suffix = /cift|çift|iki\s*kat|2\s*kat/.test(n) ? "04" : "03";
  return `7897.${w}30.${suffix}`;
}

export { norm as servisRafNorm };
