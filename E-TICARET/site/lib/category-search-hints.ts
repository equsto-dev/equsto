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

/** Izgara tablası / istif rafı — gerçek ızgara makinesi değil. */
export function isIzgaraAccessory(name: string, category: string): boolean {
  const n = foldTr(name);
  const cat = foldTr(category);
  if (/istif raf|izgara tabl|4 izgara tab|raf.*izgara tab/.test(n)) return true;
  if (/istif-raf/.test(cat) && /izgara tab|izgara tabl/.test(n)) return true;
  return false;
}

export function isPrimaryIzgaraProduct(name: string, category: string): boolean {
  if (isIzgaraAccessory(name, category)) return false;
  const cat = foldTr(category);
  const n = foldTr(name);
  if (/izgar|griller|salamander|kati-yakitli-izgar|sanayi-tipi-izgar|tost-mak/.test(cat)) {
    return true;
  }
  return /\bizgara\b|\bizgaralar\b/.test(n) && !/tabl|istif raf/.test(n);
}

/** Kuzine / ocak üzerine entegre fırın — bağımsız fırın değil. */
export function isKuzineWithFirin(name: string, category: string): boolean {
  const n = foldTr(name);
  const cat = foldTr(category);
  if (
    /gazli-firinli-kuzine|gazli-firinli-kuziler|elektrikli-kuzine|900-seri-kuzine|gazli-firinli-ve-setustu-gazli-ocak/.test(
      cat,
    )
  ) {
    return true;
  }
  if (/kuzine firinli|firinli kuzine|firinli gazli|buyuk firinli/.test(n)) return true;
  if (/kuzine/.test(n) && /firinli/.test(n)) return true;
  if (/acik ates|acik ocak/.test(n) && /firinli|firin/.test(n)) return true;
  return false;
}

/** Fırın davlumbazı, tepsi arabası, stand vb. */
export function isFirinAccessory(name: string, category: string): boolean {
  const n = foldTr(name);
  const cat = foldTr(category);
  if (/davlumbaz|tepsi stand|mobil tepsi|tepsi arab|firin icin tepsi|ultravent/.test(n)) {
    return true;
  }
  if (
    /davlumbaz|tepsi-stand|mobil-tepsi|kombi-konveksiyonlu-firin-aksesuar|20-2-1-20-2-2-mobil-tepsi/.test(
      cat,
    )
  ) {
    return true;
  }
  return false;
}

export function isPrimaryFirinProduct(
  name: string,
  category: string,
  brand = "",
): boolean {
  if (isKuzineWithFirin(name, category) || isFirinAccessory(name, category)) {
    return false;
  }
  const n = foldTr(name);
  const cat = foldTr(category);
  const b = foldTr(brand);

  if (
    /kombi-firin|konveksiyonel-firin|pastane-firin|rational-combi|rational-self-cooking|pizza-firin|konvoyerlu-pizza|pide-lahmacun|linemiss-linemicro-serisi-firin|setalti-firin|konveksiyonlu-firin/.test(
      cat,
    )
  ) {
    return true;
  }
  if (
    /unox|rational|firinmak/.test(b) &&
    /firin|bakertop|cheftop|kombi|konveksiyon|speedpro|bakerlux|icombi/.test(n) &&
    !/davlumbaz|stand|arab|tepsi/.test(n)
  ) {
    return true;
  }
  if (
    /konveksiyonlu firin|konveksiyonlu kombi|kombi firin|bakertop|cheftop|pizza firin|pastane firin|setalti firin|buhar konveksiyonlu/.test(
      n,
    ) &&
    !/kuzine|firinli gazli|acik ates/.test(n)
  ) {
    return true;
  }
  return false;
}

/** Meili `firin` sorgusunda kuzine-fırınlı kategorileri hariç tut. */
export const KUZINE_FIRIN_MEILI_FILTER_CATEGORIES = [
  "gazli-firinli-kuzine",
  "gazli-firinli-kuziler",
  "elektrikli-kuzine",
  "900-seri-kuzineler",
  "gazli-firinli-ve-setustu-gazli-ocaklar",
] as const;

export function categorySearchHints(
  dept: string,
  category: string,
  name = "",
): string {
  const hints: string[] = [];
  const cat = foldTr(category);
  const n = foldTr(name);

  if (
    /izgar|salamander|charbroil|char-broil/.test(cat) ||
    (/izgar|salamander/.test(n) && !isIzgaraAccessory(name, category))
  ) {
    hints.push("izgara", "izgaralar");
  }
  if (
    (/firin|kombi|konveksiyon|bakertop|cheftop|pizza-firin/.test(cat) ||
      /firin|kombi firin|konveksiyon/.test(n)) &&
    !isKuzineWithFirin(name, category)
  ) {
    hints.push("firin", "konveksiyonlu", "kombi");
  }
  if (/ocak|kuzin|gazli-firinli-kuzine|900-seri-kuzine/.test(cat) || /ocak|kuzine/.test(n)) {
    hints.push("ocak", "kuzine");
  }
  if (/induksiyon|enduksiyon/.test(cat) || /induksiyon|enduksiyon/.test(n)) {
    hints.push("induksiyonlu", "enduksiyonlu", "induksiyon", "enduksiyon", "ocak");
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
  induksiyonlu: ["enduksiyonlu", "enduksiyon"],
  enduksiyonlu: ["induksiyonlu", "induksiyon"],
  induksiyon: ["enduksiyon"],
  enduksiyon: ["induksiyon"],
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
