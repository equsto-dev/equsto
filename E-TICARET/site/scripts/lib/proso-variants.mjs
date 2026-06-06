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
import { expandVariantsFromSlugExcel } from "./proso-expand-variants.mjs";
import { resolveSlugMap } from "./proso-prosogutma-slug-map.mjs";

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

export function extractProsoVariants(urun, options = {}) {
  const fromTables = extractCaglayanVariants(urun);
  if (fromTables.length) return fromTables;

  const slugMap = urun.slug ? resolveSlugMap(urun.slug) : null;
  const modelOverride = slugMap?.modelKod || "";

  const pdfText = urun.pdfText || urun.teknik?.pdfText || "";
  if (pdfText) {
    const fromPdf = extractProsoPdfVariants(
      pdfText,
      urun.baslik || urun.title || urun.slug,
      modelOverride
    );
    if (fromPdf.length) return fromPdf;
  }
  if (options.excelIndex) {
    return expandVariantsFromSlugExcel(urun, options.excelIndex);
  }
  return [];
}
