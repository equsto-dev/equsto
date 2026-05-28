/**
 * Proso teknik veri → EQ varyantları (Çağlayan import ile aynı alan adları).
 */
import {
  buildVariantImages,
  eqBrandName,
  eqSku,
  extractCaglayanVariants,
  extractDepthList,
  resolveVariantTeknik,
  sortVariantsByOlculer,
  variantDisplayName,
  variantModelNo,
  variantSlugId,
} from "./caglayan-variants.mjs";
import { extractProsoPdfVariants } from "./proso-pdf-variants.mjs";

export {
  eqBrandName,
  eqSku,
  sortVariantsByOlculer,
  variantDisplayName,
  variantModelNo,
  variantSlugId,
  buildVariantImages,
  extractDepthList,
  resolveVariantTeknik,
};

export function extractProsoVariants(urun) {
  const fromTables = extractCaglayanVariants(urun);
  if (fromTables.length) return fromTables;
  const pdfText = urun.pdfText || urun.teknik?.pdfText || "";
  if (pdfText) {
    return extractProsoPdfVariants(pdfText, urun.baslik || urun.title || urun.slug);
  }
  return [];
}
