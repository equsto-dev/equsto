import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import {
  isFirinAccessory,
  isIzgaraAccessory,
  isKuzineWithFirin,
  isPrimaryFirinProduct,
  isPrimaryIzgaraProduct,
} from "@/lib/category-search-hints";
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
function accessoryPenalty(
  name: string,
  category: string,
  brand: string,
  tokens: string[],
): number {
  const n = foldTr(name);
  const cat = foldTr(category);
  let penalty = 0;

  if (tokens.some((t) => t === "izgara" || t === "izgaralar" || t === "ızgara")) {
    if (isIzgaraAccessory(name, category)) penalty += 120;
    else if (!isPrimaryIzgaraProduct(name, category)) penalty += 25;
  }

  if (tokens.some((t) => t.startsWith("firin"))) {
    if (isKuzineWithFirin(name, category)) penalty += 140;
    else if (isFirinAccessory(name, category)) penalty += 110;
    else if (!isPrimaryFirinProduct(name, category, brand)) penalty += 30;
  }

  if (/tel firc|firca|temizlik firc/.test(n)) penalty += 90;
  if (/firin icin tepsi|tepsi arab/.test(n)) penalty += 70;
  if (/mutfak arab/.test(n) && !/konveksiyon|kombi firin/.test(n)) penalty += 50;
  if (
    /arabasi|arabali|kit arab/.test(n) &&
    /firin|tepsi|teps/.test(n) &&
    !/konveksiyon|kombi firin|kuzine firin/.test(n)
  ) {
    penalty += 45;
  }
  if (/istif-raf/.test(cat) && tokens.some((t) => t.startsWith("izgar"))) {
    penalty += 100;
  }

  return penalty;
}

function nameRelevanceBoost(
  name: string,
  category: string,
  brand: string,
  tokens: string[],
): number {
  const n = foldTr(name);
  const cat = foldTr(category);
  const b = foldTr(brand);
  let boost = 0;

  for (const t of tokens) {
    const stem = t.replace(/lar$|ler$/, "");
    if (t.startsWith("izgar") || stem === "izgar") {
      if (isPrimaryIzgaraProduct(name, category)) boost += 80;
      continue;
    }
    if (t.startsWith("firin") || stem === "firin") {
      if (isPrimaryFirinProduct(name, category, brand)) boost += 100;
      if (/unox|rational|firinmak/.test(b)) boost += 35;
      if (
        /kombi-firin|konveksiyonel-firin|rational-self-cooking|rational-combi|linemiss-linemicro-serisi-firin|pizza-firin|pastane-firin/.test(
          cat,
        )
      ) {
        boost += 28;
      }
      continue;
    }
    if (n.includes(t) || (stem.length >= 4 && n.includes(stem))) {
      boost += n.indexOf(t) >= 0 && n.indexOf(t) < 24 ? 40 : 28;
    } else if (cat.includes(stem)) {
      boost += 18;
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
        nameRelevanceBoost(
          String(h.name || ""),
          String(h.category || ""),
          String(h.brand || ""),
          tokens,
        ) -
        accessoryPenalty(
          String(h.name || ""),
          String(h.category || ""),
          String(h.brand || ""),
          tokens,
        ),
    }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((x) => x.h);
}
