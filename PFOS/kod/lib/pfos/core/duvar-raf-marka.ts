import { resolveTipKodu } from "./tip-kodu";
import { isDuvarRafiReferans } from "../referans/duvar-raf-heuristics";
import { parseEqSku } from "./equsto-fiyat-sku";

/** PFOS duvar / basket raf — EQUSTO Fiyat Listesi 2026 (EQ.KDUVR*, KBASRAF) */
export const DUVAR_RAF_MARKA = "Equsto";
export const DUVAR_RAF_EQ_SERIES = new Set([
  "KDUVR01",
  "KDUVR02",
  "KSDUVR03",
  "KBASRAF",
]);

export const DUVAR_RAF_TIP_KODLARI = new Set(["duvar_rafi", "basket_rafi"]);

export function isEqustoDuvarRafSku(sku: string | null | undefined): boolean {
  const parsed = parseEqSku(sku);
  return parsed ? DUVAR_RAF_EQ_SERIES.has(parsed.kod) : false;
}

export function isEqustoDuvarRafRow(
  sku: string | null | undefined,
  ad?: string | null,
): boolean {
  if (isEqustoDuvarRafSku(sku)) return true;
  const blob = `${sku ?? ""} ${ad ?? ""}`.toLowerCase();
  return /duvar\s*raf|basket\s*raf/.test(blob) && !/davlumbaz/.test(blob);
}

export function isDuvarRafiTipKodu(tip: string | null | undefined): boolean {
  return DUVAR_RAF_TIP_KODLARI.has(resolveTipKodu(String(tip ?? "").trim()));
}

export function isDuvarRafiPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isDuvarRafiTipKodu(opts.urunTipi)) return true;
  return isDuvarRafiReferans(opts.isim);
}
