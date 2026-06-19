import { displayIsimFromSablon } from "../core/ozel-imalat";
import { isOztiBuzdolabiSku } from "../core/ozti-marka";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Soğuk servis bankosu — sıcak / nötr / dekoratif / kasa hariç */
export function isSogukServisBankoSablon(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!/servis\s*banko/.test(n)) return false;
  if (/sicak|sıcak|dekoratif|notr|nötr|kasa/.test(n)) return false;
  return true;
}

function kapiLabel(kapi: number): string {
  if (kapi === 1) return "tek kapılı";
  if (kapi === 2) return "iki kapılı";
  if (kapi === 3) return "üç kapılı";
  if (kapi === 4) return "dört kapılı";
  return `${kapi} kapılı`;
}

function kapiSayisiFromText(...texts: (string | null | undefined)[]): number | null {
  for (const t of texts) {
    const n = norm(String(t ?? ""));
    const digit = n.match(/(\d)\s*kap/i);
    if (digit) return Number(digit[1]);
    if (/\bcift\b|cift inox|çift|iki inox|iki kap/.test(n)) return 2;
    if (/\buc\b|uc kap|3 kap|üç/.test(n)) return 3;
    if (/\bdort\b|dort kap|4 kap|dört/.test(n)) return 4;
    if (/tek\s*kap|1\s*kap/.test(n)) return 1;
  }
  return null;
}

function kapiFromGenislikCm(width: number): number | null {
  const w = Math.round(width);
  if (w >= 220) return 4;
  if (w >= 165) return 3;
  if (w >= 105) return 2;
  if (w >= 55) return 1;
  return null;
}

function olcuWidthCm(olcu: string | null | undefined): number | null {
  const m = String(olcu ?? "").match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

function isOztiTezgahTipBuzMatch(opts: {
  sku?: string | null;
  katalogAd?: string | null;
}): boolean {
  const sku = String(opts.sku ?? "").trim();
  if (sku && isOztiBuzdolabiSku(sku)) return true;
  const blob = norm(`${opts.katalogAd ?? ""} ${sku}`);
  return /7919\.|79e[34]\.|79k4\.|buzdolab|soguk\s*servis\s*banko/.test(blob);
}

/** SERVİS BANKOSU → tezgah tipi buzdolabı (kapı sayısı katalog/ölçüden) */
export function buzdolabiDisplayIsimFromSablon(
  isim: string | null | undefined,
  opts?: {
    sku?: string | null;
    katalogAd?: string | null;
    olcu?: string | null;
  },
): string {
  const base = displayIsimFromSablon(isim);
  if (!isSogukServisBankoSablon(isim)) return base;
  if (!isOztiTezgahTipBuzMatch(opts ?? {})) return base;

  const kapi =
    kapiSayisiFromText(opts?.katalogAd, opts?.sku, isim) ??
    (() => {
      const w = olcuWidthCm(opts?.olcu);
      return w != null ? kapiFromGenislikCm(w) : null;
    })() ??
    2;

  return `tezgah tipi buzdolabı, ${kapiLabel(kapi)}`;
}
