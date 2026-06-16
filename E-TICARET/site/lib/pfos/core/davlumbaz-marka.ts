import { isEqustoFiyatListesiSku, parseEqSku } from "./equsto-fiyat-sku";

/** PFOS davlumbaz — Pimak katalog (PIMAK.*) + Equsto fiyat listesi (EQ.KDAV*) */
export const DAVLUMBAZ_MARKA = "Equsto";
export const PIMAK_DAVLUMBAZ_MARKA = "Pimak";

export function isPimakDavlumbazSku(sku: string | null | undefined): boolean {
  return /^PIMAK\.\d{5}\./i.test(String(sku ?? "").trim());
}

/** EQUSTO katalog derinlikleri (cm) */
export const EQUSTO_DAVLUMBAZ_DEPTHS_CM = [100, 120, 150, 200, 250] as const;

/** Eski PIMAK/EQUSTO 5 haneli orta blok (geriye dönük). */
export function isEqustoDavlumbazMiddleBlock(mid: string): boolean {
  if (!/^\d{5}$/.test(mid)) return false;
  const tail = Number(mid.slice(3));
  if (tail === 70 || tail === 85 || tail === 60 || tail === 75 || tail === 80) {
    return false;
  }
  const width = Number(mid.slice(0, 3));
  if (width < 120) return false;
  return tail === 55 || tail === 5 || tail === 15 || tail === 25 || tail === 0;
}

export function isEqustoDavlumbazRow(sku: string | null | undefined, ad?: string | null): boolean {
  const s = String(sku ?? "").trim();
  if (isEqustoFiyatListesiSku(s)) {
    const kod = parseEqSku(s)?.kod ?? "";
    if (kod.startsWith("KDAV")) return true;
    return false;
  }
  const mid = s.match(/^(?:EQUSTO|PIMAK)\.(\d{5})\./i)?.[1];
  if (!mid) return false;
  if (ad && /tezgah|sehpa|evye|calisma|çalışma/i.test(ad) && !/davlumbaz/i.test(ad)) {
    return false;
  }
  if (ad && /davlumbaz/i.test(ad)) return true;
  return isEqustoDavlumbazMiddleBlock(mid);
}

export function isOztiDavlumbazSku(sku: string | null | undefined): boolean {
  return /^7885\./i.test(String(sku ?? "").trim());
}

/** 350×120 cm → 35125 (EQUSTO davlumbaz ölçü kodu) */
export function equstoDavlumbazSizePrefix(widthCm: number, depthCm: number): string {
  const w = Math.round(widthCm);
  const d = Math.round(depthCm);
  return `${String(w).padStart(3, "0")}${String(d).padStart(2, "0")}`;
}

export function snapDavlumbazDepthCm(depthCm: number): number {
  const d = Math.round(depthCm);
  let best: number = EQUSTO_DAVLUMBAZ_DEPTHS_CM[0];
  let dist = Math.abs(d - best);
  for (const candidate of EQUSTO_DAVLUMBAZ_DEPTHS_CM) {
    const next = Math.abs(d - candidate);
    if (next < dist) {
      best = candidate;
      dist = next;
    }
  }
  return best;
}

export type DavlumbazForm = "duvar" | "orta" | null;

export function parseDavlumbazForm(isim: string): DavlumbazForm {
  const n = String(isim ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
  if (/orta\s*tip/.test(n)) return "orta";
  if (/duvar\s*tip/.test(n)) return "duvar";
  return null;
}

/** EQUSTO davlumbaz varyant soneki */
export function inferEqustoDavlumbazSuffix(
  isim: string,
  form: DavlumbazForm,
): string {
  const n = String(isim ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
  const filtrel = /filtresiz/.test(n) ? false : /filtreli|filtrel/.test(n) ? true : null;
  const f = form ?? (/orta\s*tip/.test(n) ? "orta" : "duvar");

  if (f === "duvar") {
    if (filtrel === false) return "11";
    return "01";
  }
  if (filtrel === false) return "00";
  return "10";
}

export function generateEqustoDavlumbazSku(
  isim: string,
  widthCm: number,
  depthCm: number,
): string {
  const form = parseDavlumbazForm(isim);
  const depth = snapDavlumbazDepthCm(depthCm);
  const prefix = equstoDavlumbazSizePrefix(widthCm, depth);
  const suffix = inferEqustoDavlumbazSuffix(isim, form);
  return `PIMAK.${prefix}.${suffix}`;
}

export function dimsCmFromOlcu(olcu: string): [number, number] | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;
  let w = nums[0];
  let d = nums[1];
  if (w > 900) w = Math.round(w / 10);
  if (d > 900) d = Math.round(d / 10);
  return [Math.round(w), Math.round(d)];
}

export function dimsCmFromProductName(name: string): [number, number] | null {
  const s = String(name ?? "")
    .toLowerCase()
    .replace(/[×x]/g, "*");
  const triple = s.match(/(\d{3,4})\s*\*\s*(\d{3,4})/);
  if (triple) {
    let w = Number(triple[1]);
    let d = Number(triple[2]);
    if (w >= 900) w = Math.round(w / 10);
    if (d >= 900) d = Math.round(d / 10);
    return [w, d];
  }
  const pair = s.match(/(\d{2,3})\s*\*\s*(\d{2,3})/);
  if (pair) return [Number(pair[1]), Number(pair[2])];
  return null;
}
