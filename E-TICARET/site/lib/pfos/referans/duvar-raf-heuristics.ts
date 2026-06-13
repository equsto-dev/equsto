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
  return /duvar\s*raf/.test(n) && !/davlumbaz/.test(n);
}

/** 140*30 veya 140*30*30 → 7897.14030.30 */
export function oztiDuvarRafSkuFromOlcu(olcu: string): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const m = raw.match(/(\d{2,4})\s*[*xX×]\s*(\d{2,3})(?:\s*[*xX×]\s*(\d{2,3}))?/);
  if (!m) return null;
  const w = m[1];
  const d = m[2].padStart(2, "0");
  const h = (m[3] ?? m[2]).padStart(2, "0");
  return `7897.${w}${d}.${h}`;
}

export { norm as duvarRafNorm };
