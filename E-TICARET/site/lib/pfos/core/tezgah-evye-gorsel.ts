function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

const PISIRME_BLOCK_RE =
  /makarna|fritoz|fritöz|izgar|ocak|kuzine|firin|fırın|salamander|pisir|pişir|wok|benmari|kazan|tost|waffle|frit/i;

/** Öztiryakiler pişirme SKU — .11/.12/.17 evye son eki değil */
function isOztiPisirmeSku(key: string): boolean {
  return /^78\d{2}\./i.test(key);
}

/**
 * Tezgah evye görseli yalnızca evye bağlamında — SKU son eki tek başına yeterli değil.
 * (7858.N1.40703.11 gibi Öztiryakiler varyant kodları evye değildir.)
 */
export function isTezgahEvyeGorselContext(
  sku: string | null | undefined,
  tanim?: string | null,
): boolean {
  const key = normSku(sku);
  const name = String(tanim ?? "").toLowerCase();
  if (!key && !name) return false;
  if (isOztiPisirmeSku(key)) return false;
  if (PISIRME_BLOCK_RE.test(name)) return false;

  if (
    /tek\s*evye|1\s*evye|çift\s*evye|cift\s*evye|iki\s*evye|üç\s*evye|uc\s*evye|3\s*evye/.test(
      name,
    )
  ) {
    return true;
  }
  if (/evye/.test(name) && /tezgah|tablali|tablalı|damlalik|damlalık/.test(name)) {
    return true;
  }
  if (/^EQUSTO\.\d+\.(11|12|17)$/i.test(key)) return true;
  return false;
}

export function tezgahEvyeGorselRel(
  sku: string | null | undefined,
  tanim?: string | null,
): string | null {
  if (!isTezgahEvyeGorselContext(sku, tanim)) return null;
  const key = normSku(sku);
  const name = String(tanim ?? "").toLowerCase();

  if (
    key.endsWith(".12") ||
    key.endsWith("-12") ||
    /çift\s*evye|cift\s*evye|iki\s*evye/.test(name)
  ) {
    return "/data/images/catalog/cafemarkt-images/tablali-evye-cift-goz-damlaliksiz_1.jpg";
  }
  if (
    key.endsWith(".17") ||
    key.endsWith("-17") ||
    /üç\s*evye|uc\s*evye|3\s*evye/.test(name)
  ) {
    return "/data/images/catalog/cafemarkt-images/tablali-evye-uc-goz-damlaliksiz_1.jpg";
  }
  if (
    key.endsWith(".11") ||
    key.endsWith("-11") ||
    /tek\s*evye|1\s*evye/.test(name)
  ) {
    return "/data/images/catalog/cafemarkt-images/tablali-evye-tek-goz-damlaliksiz_1.jpg";
  }
  return null;
}
