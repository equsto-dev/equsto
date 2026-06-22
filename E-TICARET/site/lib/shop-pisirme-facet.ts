/** Pişirme tipi facet — eq-pisirme-facets.js ile senkron. */

export const PISIRME_FACET_ORDER = [
  "ocaklar",
  "izgaralar",
  "fritozler",
  "firinlar",
  "benmariler",
  "diger-pisirme",
] as const;

export type PisirmeFacetKey = (typeof PISIRME_FACET_ORDER)[number];

export const PISIRME_FACET_LABELS: Record<PisirmeFacetKey, string> = {
  ocaklar: "Ocaklar",
  izgaralar: "Izgaralar",
  fritozler: "Fritözler",
  firinlar: "Fırınlar",
  benmariler: "Benmariler",
  "diger-pisirme": "Diğer pişirme",
};

const CATEGORY_FACET: Record<string, PisirmeFacetKey> = {
  ocaklar: "ocaklar",
  "sanayi-ocaklari": "ocaklar",
  "i-nduksiyonlu-ocaklar": "ocaklar",
  "induksiyonlu-ocaklar": "ocaklar",
  kuzineler: "ocaklar",
  "gazli-kuzineler": "ocaklar",
  "doner-ocaklari-": "ocaklar",
  "doner-ocaklari": "ocaklar",
  "adr-seri-doner-robotu": "ocaklar",
  "doner-makineleri": "ocaklar",
  "elektrikli-setustu-ocaklar": "ocaklar",
  "elektrikli-setustu-dinlendirme-ocagi": "ocaklar",
  "yer-izgaralari": "izgaralar",
  "sanayi-tipi-izgaralar": "izgaralar",
  "komurlu-izgara": "izgaralar",
  izgaralar: "izgaralar",
  "sulu-izgaralar": "izgaralar",
  "gazli-izgaralar": "izgaralar",
  "elektrikli-izgaralar": "izgaralar",
  "elektrikli-izgara": "izgaralar",
  "setustu-elektrikli-izgaralar": "izgaralar",
  "lava-tasli-izgaralar": "izgaralar",
  "ocakbasi-izgara": "izgaralar",
  "asansorlu-izgara": "izgaralar",
  salamander: "izgaralar",
  "char-izgara": "izgaralar",
  lavtasli_izgara: "izgaralar",
  "speedelight-mekanik-ayarlanabilen-ust-isitici-plaka-nervurlu": "izgaralar",
  "speedelight-manuel-ayarlanabilen-ust-isitici-plaka-nervurlu": "izgaralar",
  fritozler: "fritozler",
  firinlar: "firinlar",
  "linemiss-linemicro-serisi-firinlar": "firinlar",
  "kombi-firin": "firinlar",
  "konveksiyonlu-firin": "firinlar",
  "pizza-firinlari": "firinlar",
  "dijital-kontrol-panelli": "firinlar",
  "tas-firinlar-mikrodalga-firinlar": "firinlar",
  "mikrodalga-firin": "firinlar",
  "jet-mikrodalga-firin": "firinlar",
  "komurlu-firin": "firinlar",
  benmariler: "benmariler",
  "sos-benmariler": "benmariler",
  "kaynatma-tenceleri": "benmariler",
  "kaynatma-tenceresi": "benmariler",
  "gazli-elektrikli-kaynatma-tenceresi": "benmariler",
  "makarna-haslamalar": "benmariler",
  "makarna-hafllamalar": "benmariler",
  "devrilir-tavalar": "benmariler",
  "devrilir-tava": "benmariler",
  "patates-dinlendirmeler": "benmariler",
  "patates-dinlendirme": "benmariler",
  "buharli-kaynatma-tenceeleri": "benmariler",
  "hareketli-bain-marie": "benmariler",
  "setustu-bain-marie": "benmariler",
  "elektrikli-kaynatma-kazanlari-ebe-easy-line": "benmariler",
  "eb-elektrikli-kaynatma-kazanlari-smart": "benmariler",
  "elektrikli-kaynatma-kazanlari": "benmariler",
  "gazli-kaynatma-kazanlari": "benmariler",
  "gazli-silindirik-kaynatma-kazanlari": "benmariler",
  "dikdortgen-kaynatma-kazanlari": "benmariler",
  "elektrikli-silindirik-kaynatma-kazanlari": "benmariler",
  "otomatik-makarna-pisiriciler": "benmariler",
  "ara-tezgahlar": "diger-pisirme",
  "setustu-ara-tezgahlar": "diger-pisirme",
  "dolaplar-ve-taban-raflari-ara-tezgahlar": "diger-pisirme",
  "taban-raflari": "diger-pisirme",
  "alt-dolaplar": "diger-pisirme",
  dolaplar: "diger-pisirme",
  "yardimci-ekipmanlar": "diger-pisirme",
  ekipmanlar: "diger-pisirme",
  "banket-arabalari": "diger-pisirme",
  "tost-makineleri": "diger-pisirme",
  "waffle-krep-makineleri": "diger-pisirme",
  "pilic-cevirme-makineleri": "diger-pisirme",
  "pilic-cevirme-makinesi": "diger-pisirme",
  "pilic-cevirme": "diger-pisirme",
  "cay-makineleri": "diger-pisirme",
  "ekmek-kizartma-makineleri": "diger-pisirme",
  "cihazalti-soguk-ve-dondurucu-dolaplar": "diger-pisirme",
  "cihazalti-sogutucu-ve-derin-dondurucular": "diger-pisirme",
};

const CATEGORY_PREFIX_FACET: [string, PisirmeFacetKey][] = [
  ["pilic-", "diger-pisirme"],
  ["pilic_", "diger-pisirme"],
];

export type PisirmeFacetHit = {
  dept?: string;
  category?: string;
  c?: string;
  name?: string;
  n?: string;
  brand?: string;
  b?: string;
  specs?: string;
  raw?: {
    dept?: string;
    category?: string;
    name?: string;
    specs?: string;
    urun_kategori?: string;
    alt_kategori_1?: string;
    alt_kategori_2?: string;
    urun_alt_kategori?: string;
  };
};

function lc(s: unknown): string {
  return String(s ?? "").toLocaleLowerCase("tr");
}

function categorySlug(hit: PisirmeFacetHit): string {
  return lc(hit.category || hit.c || hit.raw?.category || "");
}

function productHaystack(hit: PisirmeFacetHit): string {
  return lc(
    [
      hit.name,
      hit.n,
      hit.category,
      hit.c,
      hit.brand,
      hit.b,
      hit.specs,
      hit.raw?.name,
      hit.raw?.category,
      hit.raw?.specs,
      hit.raw?.urun_kategori,
      hit.raw?.alt_kategori_1,
      hit.raw?.alt_kategori_2,
      hit.raw?.urun_alt_kategori,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function facetFromCategorySlug(cat: string): PisirmeFacetKey | null {
  if (!cat) return null;
  if (CATEGORY_FACET[cat]) return CATEGORY_FACET[cat];
  for (const [prefix, facet] of CATEGORY_PREFIX_FACET) {
    if (cat.startsWith(prefix)) return facet;
  }
  return null;
}

function classifyFromHaystack(hay: string): PisirmeFacetKey | null {
  if (!hay) return null;
  if (/fritöz|fritoz|freidora|deep\s*fry|friteuse/.test(hay)) return "fritozler";
  if (/mikrodalga|microwave|jet\s*oven|speed\s*oven/.test(hay)) return "firinlar";
  if (
    /pizza\s*fır|pizza\s*fir|konveksiyon|kombi\s*fır|kombi\s*fir|mayalama\s*dolab|combi\s*oven|taş\s*fır|tas\s*fir/.test(
      hay,
    )
  ) {
    return "firinlar";
  }
  if (/\bfırın\b|\bfirin\b/.test(hay) && !/mikrodalga|microwave/.test(hay)) {
    return "firinlar";
  }
  if (
    /ızgara|izgara|grill|salamander|plancha|lavtaş|lavtas|griddle|char\s*grill|broiler|gratin/.test(
      hay,
    )
  ) {
    return "izgaralar";
  }
  if (
    /ocak|kuzine|indüksiyon|induksiyon|endüksiyon|enduksiyon|wok|döner|doner|kebab|kebap/.test(
      hay,
    ) &&
    !/dondurucu|soğutucu|sogutucu|buzdolab/.test(hay)
  ) {
    return "ocaklar";
  }
  if (
    /benmari|bain\s*marie|kaynatma\s*tencere|kaynatma\s*kazan|makarna\s*haş|makarna\s*has|devrilir\s*tava|patates\s*dinlen|buharli\s*kaynatma/.test(
      hay,
    )
  ) {
    return "benmariler";
  }
  if (
    /tost\s*mak|waffle|krep\s*mak|ara\s*tezgah|taban\s*raf|yardımcı\s*ekipman|yardimci\s*ekipman|pilic|piliç|rotisserie|çevirme|cevirme|ekmek\s*kızart|cay\s*mak|çay\s*mak/.test(
      hay,
    )
  ) {
    return "diger-pisirme";
  }
  return null;
}

export function classifyPisirmeFacet(hit: PisirmeFacetHit): PisirmeFacetKey | null {
  const fromCat = facetFromCategorySlug(categorySlug(hit));
  if (fromCat) return fromCat;
  return classifyFromHaystack(productHaystack(hit));
}

export function isPisirmeProduct(hit: PisirmeFacetHit): boolean {
  const dept = lc(hit.raw?.dept || hit.dept || "");
  if (dept === "pisirme") return true;
  const hay = productHaystack(hit);
  if (!hay) return false;
  if (/^pisirme\b|pişirme|pisirme ekipman/.test(hay)) return true;
  return !!classifyPisirmeFacet(hit);
}

export function hitMatchesPisirmeFacets(
  hit: PisirmeFacetHit,
  keys: string[],
): boolean {
  if (!keys.length) return true;
  const k = classifyPisirmeFacet(hit);
  return k ? keys.includes(k) : false;
}

export function countPisirmeFacets(
  hits: PisirmeFacetHit[],
): Partial<Record<PisirmeFacetKey, number>> {
  const out: Partial<Record<PisirmeFacetKey, number>> = {};
  for (const h of hits) {
    const k = classifyPisirmeFacet(h);
    if (k) out[k] = (out[k] || 0) + 1;
  }
  return out;
}
