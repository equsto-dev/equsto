import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { foldTr } from "@/lib/search-query";

const PRIMARY_EQUIPMENT_TERMS = new Set([
  "izgara",
  "izgaralar",
  "firin",
  "firinlar",
  "ocak",
  "buzdolab",
  "buzdolabi",
  "buzdolap",
  "fritoz",
  "blender",
]);

/** Aksesuar / yan ürün — ana ekipman sorgularında alta it. */
function accessoryPenalty(name: string): number {
  const n = foldTr(name);
  if (/tel firc|firca|firin icin tepsi|tepsi arab|mutfak arab|temizlik firc/.test(n)) {
    return 80;
  }
  if (/arabasi|arabali|kit arab/.test(n) && /firin|tepsi|teps/.test(n) && !/konveksiyon|kombi firin|kuzine firin/.test(n)) {
    return 40;
  }
  return 0;
}

function nameRelevanceBoost(name: string, category: string, tokens: string[]): number {
  const n = foldTr(name);
  const cat = foldTr(category);
  let boost = 0;
  for (const t of tokens) {
    const stem = t.replace(/lar$|ler$/, "");
    if (n.includes(t) || (stem.length >= 4 && n.includes(stem))) {
      boost += n.indexOf(t) >= 0 && n.indexOf(t) < 20 ? 50 : 35;
      if (new RegExp(`(^|[\\s-])${stem}`, "i").test(name)) boost += 15;
    } else if (cat.includes(stem)) {
      boost += 20;
    }
  }
  return boost;
}

function shouldRerank(q: string, tokens: string[]): boolean {
  if (!tokens.length) return false;
  if (tokens.length === 1 && tokens[0].length >= 4) return true;
  return tokens.some((t) => PRIMARY_EQUIPMENT_TERMS.has(t));
}

/** Meili sonrası — ürün adı/kategori önceliği (izgara, fırın vb.). */
export function rankSearchHitsByRelevance(
  q: string,
  hits: CatalogSearchHit[],
): CatalogSearchHit[] {
  if (!hits.length) return hits;
  const tokens = foldTr(q)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  if (!shouldRerank(q, tokens)) return hits;

  return hits
    .map((h, idx) => ({
      h,
      idx,
      score:
        nameRelevanceBoost(String(h.name || ""), String(h.category || ""), tokens) -
        accessoryPenalty(String(h.name || "")),
    }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((x) => x.h);
}
