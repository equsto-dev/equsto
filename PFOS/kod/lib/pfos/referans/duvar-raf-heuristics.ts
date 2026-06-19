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
  if (/basket\s*raf/.test(n) || /tava\s*raf/.test(n)) return true;
  return /duvar\s*raf/.test(n) && !/davlumbaz/.test(n);
}

const DUVAR_RAF_EN_CM = [90, 100, 110, 120, 130, 140, 150, 160, 170] as const;
const DUVAR_RAF_DER_CM = [30, 35] as const;

function snapGrid(value: number, grid: readonly number[]): number {
  let best = grid[0];
  for (const g of grid) {
    if (Math.abs(value - g) < Math.abs(value - best)) best = g;
  }
  return best;
}

/** Referans ölçüsü → EQUSTO duvar raf en×derinlik (cm) */
export function normalizeDuvarRafDims(
  olcu: string,
  isim?: string | null,
): { en: number; derinlik: number } | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;

  let en = nums[0];
  let der = nums[1];
  if (Math.max(en, der, nums[2] ?? 0) >= 400) {
    en = Math.round(en / 10);
    der = Math.round(der / 10);
  }

  const basket = /basket\s*raf|tezgah\s*ust|tezgahust/.test(norm(isim ?? ""));
  if (basket) {
    return { en: snapGrid(en, DUVAR_RAF_EN_CM), derinlik: 50 };
  }

  return {
    en: snapGrid(en, DUVAR_RAF_EN_CM),
    derinlik: snapGrid(der, DUVAR_RAF_DER_CM),
  };
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

/** @deprecated PFOS artık Öztiryakiler 7897 duvar rafı kullanmaz */
export function oztiDuvarRafSkuFromOlcu(olcu: string): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const m = raw.match(/(\d{2,4})\s*[*xX×]\s*(\d{2,3})(?:\s*[*xX×]\s*(\d{2,3}))?/);
  if (!m) return null;
  const w = snapDuvarRafWidthCm(Number(m[1]));
  return `7897.${w}30.30`;
}

export { norm as duvarRafNorm };
