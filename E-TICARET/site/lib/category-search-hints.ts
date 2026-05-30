/** İndeks + fallback — yalnızca kategori/ürün adına dayalı ipuçları (dept geneli yok). */

export function foldTr(s: string): string {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

export function categorySearchHints(
  dept: string,
  category: string,
  name = "",
): string {
  const hints: string[] = [];
  const cat = foldTr(category);
  const n = foldTr(name);

  if (/izgar|salamander|charbroil|char-broil/.test(cat) || /izgar|salamander/.test(n)) {
    hints.push("izgara", "izgaralar");
  }
  if (
    /firin|kombi|konveksiyon|bakertop|cheftop|pizza-firin/.test(cat) ||
    /firin|kombi firin|konveksiyon/.test(n)
  ) {
    hints.push("firin", "konveksiyonlu", "kombi");
  }
  if (/ocak|kuzin/.test(cat) || /ocak|kuzin/.test(n)) {
    hints.push("ocak", "kuzine");
  }
  if (/fritoz/.test(cat) || /fritoz/.test(n)) hints.push("fritoz");
  if (/buzdolab|sogutma|derin-dondur|sok-dondur/.test(cat)) {
    hints.push("buzdolabi", "sogutma");
  }
  if (/kahve|espresso|cay|barista/.test(cat)) {
    hints.push("kahve", "espresso", "cay");
  }
  if (/bulasik|yikama/.test(cat)) hints.push("bulasik", "yikama");
  if (/blender|mikser|dograma/.test(cat) || /blender|mikser/.test(n)) {
    hints.push("blender", "mikser");
  }

  return [...new Set(hints)].filter(Boolean).join(" ");
}

/** Meilisearch synonym — dar tut; geniş terimler (elektrikli vb.) ekleme. */
export const MEILI_SYNONYMS: Record<string, string[]> = {
  esp: ["wmf", "kahve", "espresso", "cay"],
  espresso: ["wmf", "kahve", "kahve makinesi"],
  buzdolab: ["buzdolabi"],
  buzdolap: ["buzdolabi"],
  ozti: ["oztiryakiler"],
  izgara: ["izgaralar", "ızgara"],
  izgaralar: ["izgara", "ızgara"],
  "ızgara": ["izgara", "izgaralar"],
  firin: ["firinlar", "konveksiyonlu"],
  firinlar: ["firin", "konveksiyonlu"],
  kombi: ["konveksiyonlu", "firin"],
  konveksiyon: ["konveksiyonlu", "firin"],
};

export const MEILI_INDEX_SETTINGS = {
  searchableAttributes: [
    "name",
    "category",
    "brand",
    "model",
    "sku",
    "search_hints",
    "dept",
  ],
  rankingRules: [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ],
  typoTolerance: {
    minWordSizeForTypos: {
      oneTypo: 6,
      twoTypos: 10,
    },
  },
} as const;
