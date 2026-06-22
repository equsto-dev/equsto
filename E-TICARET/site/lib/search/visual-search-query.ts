import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { foldTr } from "@/lib/search-query";
import { sanitizeVisionQueryText } from "@/lib/search/parse-vision-output";
import type { ImageVisionQuery } from "@/lib/search/image-vision-query";

const RETAILER_NAMES = new Set(["equsto"]);

/** Görselde okunmayan satıcı / katalog adlarını ayıkla. */
function stripRetailerTokens(text: string): string {
  return text
    .replace(/\bequsto\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeBrand(brand: string): string {
  const b = stripRetailerTokens(brand.trim());
  if (!b) return "";
  const folded = foldTr(b);
  if (RETAILER_NAMES.has(folded)) return "";
  return b;
}

/** Vision JSON → Meilisearch sorgusu (marka yalnızca görselde okunduysa). */
export function buildVisualSearchQuery(vision: ImageVisionQuery): string {
  let q = stripRetailerTokens(String(vision.q || "").trim());
  try {
    q = sanitizeVisionQueryText(q);
  } catch {
    return "";
  }
  const brand = sanitizeBrand(vision.brand || "");
  const model = String(vision.model || "").trim();

  if (brand && !foldTr(q).includes(foldTr(brand))) {
    q = `${brand} ${q}`.trim();
  }
  if (model && !foldTr(q).includes(foldTr(model))) {
    q = `${q} ${model}`.trim();
  }
  return q;
}

function meaningfulTokens(q: string): string[] {
  return foldTr(q)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 4 && !RETAILER_NAMES.has(t));
}

/** Üst sonuçlar sorguyla anlamlı örtüşüyor mu? */
export function visualCatalogMatch(q: string, hits: CatalogSearchHit[]): boolean {
  if (!hits.length) return false;
  const tokens = meaningfulTokens(q);
  if (!tokens.length) return hits.length > 0;

  const top = hits.slice(0, 8);
  return top.some((h) => {
    const blob = foldTr(
      `${h.name || ""} ${h.category || ""} ${h.brand || ""} ${h.specs || ""}`,
    );
    return tokens.some((t) => blob.includes(t));
  });
}
