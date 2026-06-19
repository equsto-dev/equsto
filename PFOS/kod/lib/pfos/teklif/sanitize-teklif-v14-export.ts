import { displayIsimFromSablon } from "../core/ozel-imalat";
import {
  formatPfosDisplayTanim,
} from "../parse-upload/sanitize-tanim";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import { normalizeTeklifAciklamaText } from "./catalog-teklif-aciklama";

/** PDF / Excel / yazdır — tanım sütunu (proforma artığı temiz) */
export function sanitizeTeklifV14SatirTanim(
  tanim: string | null | undefined,
): string {
  return displayIsimFromSablon(formatPfosDisplayTanim(tanim));
}

export function sanitizeTeklifV14SatirAciklama(
  aciklama: string | null | undefined,
): string | undefined {
  if (!aciklama?.trim()) return undefined;
  if (/\[object\s+object\]/i.test(aciklama)) return undefined;
  const cleaned = normalizeTeklifAciklamaText(aciklama);
  return cleaned || undefined;
}

export function sanitizeTeklifV14Satir(
  satir: TeklifV14Satir,
): TeklifV14Satir {
  return {
    ...satir,
    tanim: sanitizeTeklifV14SatirTanim(satir.tanim),
    aciklama: sanitizeTeklifV14SatirAciklama(satir.aciklama),
  };
}

/** Export öncesi — site tablosu temiz olsa bile PDF/Excel için son temizlik */
export function sanitizeTeklifV14ModelForExport(
  model: TeklifModelV14,
): TeklifModelV14 {
  return {
    ...model,
    satirlar: model.satirlar.map(sanitizeTeklifV14Satir),
  };
}
