/**
 * marka.html?b= / ?slug= → kanonik vitrin URL (eq-site-urls.js ile uyumlu).
 * middleware.ts ve istemci yönlendirmesi bu modülü kullanır.
 */

const BRAND_SLUG_ALIAS: Record<string, string> = {
  atalay: "Atalay Endüstriyel Mutfak Ekipmanları",
  oztiryakiler: "Öztiryakiler Endüstriyel Mutfak",
  electrolux: "Electrolux Professional",
  inoksan: "İnoksan",
  "la-cimbali": "La Cimbali",
  faema: "Faema",
  rational: "Rational",
  empero: "Empero",
  samixir: "Samixir",
  gtech: "Gtech",
  "robot-coupe": "Robot Coupe",
  wmf: "WMF",
  hoshizaki: "Hoshizaki",
  "nuova-simonelli": "Nuova Simonelli",
  atese: "Ateşe",
  unox: "Unox",
  fac: "FAC",
  santos: "Santos",
  hobart: "Hobart",
  "bravilor-bonamat": "Bravilor Bonamat",
  vitrifrigo: "Vitrifrigo",
  bartscher: "Bartscher",
  alkan: "Alkan",
  fantom: "Fantom",
  imperia: "Imperia",
  platemate: "PlateMate",
  "hamilton-beach": "Hamilton Beach",
  menumaster: "MenuMaster",
  tribeca: "Tribeca",
  dualit: "Dualit",
  swedlinghaus: "Swedlinghaus",
  vesta: "Vesta",
  copmak: "Copmak",
  blanco: "Blanco",
  simag: "SIMAG",
};

type BrandTarget = { dept?: string; facet?: string; markaHub?: boolean; oztiOwnOnly?: boolean };

const BRAND_SHOP_TARGET: Record<string, BrandTarget> = {
  atalay: { markaHub: true, facet: "Atalay" },
  oztiryakiler: { markaHub: true, facet: "Öztiryakiler", oztiOwnOnly: true },
  "caglayan-refrigeration": { markaHub: true },
  "proso-profesyonel-sogutma": { markaHub: true },
  rational: { markaHub: true, facet: "Rational" },
  "robot-coupe": { markaHub: true, facet: "Robot Coupe" },
  wmf: { markaHub: true, facet: "WMF" },
  hoshizaki: { markaHub: true, facet: "Hoshizaki" },
  "nuova-simonelli": { markaHub: true, facet: "Nuova Simonelli" },
  atese: { markaHub: true, facet: "Ateşe" },
  unox: { markaHub: true, facet: "Unox" },
  fac: { markaHub: true, facet: "FAC" },
  santos: { markaHub: true, facet: "Santos" },
  hobart: { markaHub: true, facet: "Hobart" },
  "bravilor-bonamat": { markaHub: true, facet: "Bravilor Bonamat" },
  vitrifrigo: { markaHub: true, facet: "Vitrifrigo" },
  bartscher: { markaHub: true, facet: "Bartscher" },
  alkan: { markaHub: true, facet: "Alkan" },
  fantom: { markaHub: true, facet: "Fantom" },
  imperia: { markaHub: true, facet: "Imperia" },
  platemate: { markaHub: true, facet: "PlateMate" },
  "hamilton-beach": { markaHub: true, facet: "Hamilton Beach" },
  menumaster: { markaHub: true, facet: "MenuMaster" },
  tribeca: { markaHub: true, facet: "Tribeca" },
  dualit: { markaHub: true, facet: "Dualit" },
  swedlinghaus: { markaHub: true, facet: "Swedlinghaus" },
  vesta: { markaHub: true, facet: "Vesta" },
  copmak: { markaHub: true, facet: "Copmak" },
  blanco: { markaHub: true, facet: "Blanco" },
  simag: { markaHub: true, facet: "SIMAG" },
  electrolux: { dept: "pisirme", facet: "Electrolux" },
  inoksan: { markaHub: true, facet: "İnoksan" },
  "la-cimbali": { dept: "kahve", facet: "La Cimbali" },
  faema: { dept: "kahve", facet: "Faema" },
  empero: { dept: "yikama", facet: "Empero" },
  samixir: { dept: "hazirlik", facet: "Samixir" },
  gtech: { dept: "hazirlik", facet: "Gtech" },
};

function normBrand(name: string): string {
  return String(name || "")
    .normalize("NFC")
    .trim();
}

const TR_ASCII: Record<string, string> = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  ö: "o",
  ç: "c",
  Ğ: "g",
  Ü: "u",
  Ş: "s",
  İ: "i",
  Ö: "o",
  Ç: "c",
};

function brandSlugify(name: string): string {
  const folded = normBrand(name).replace(/[ğüşıöçĞÜŞİÖÇ]/g, (c) => TR_ASCII[c] || c);
  return folded
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function brandSlugFromName(brandName: string): string {
  const n = normBrand(brandName);
  if (!n) return "";
  for (const [slug, canon] of Object.entries(BRAND_SLUG_ALIAS)) {
    if (canon === n) return slug;
  }
  const low = n.toLocaleLowerCase("tr");
  for (const slug of Object.keys(BRAND_SLUG_ALIAS)) {
    const lab = slug.replace(/-/g, " ");
    if (low === lab || low.startsWith(lab)) return slug;
  }
  return brandSlugify(n);
}

/** @param langPrefix "" veya "/en" */
export function resolveBrandRedirectPath(brandRaw: string, langPrefix = ""): string | null {
  const b = normBrand(brandRaw);
  if (!b) return null;
  const prefix = langPrefix === "/en" ? "/en" : "";
  const slug = brandSlugFromName(b);
  if (!slug) return null;
  const t = BRAND_SHOP_TARGET[slug];
  if (t?.markaHub) return `${prefix}/shop/marka/${encodeURIComponent(slug)}`;
  if (t?.dept && t.facet) {
    return `${prefix}/shop/${encodeURIComponent(t.dept)}?marka=${encodeURIComponent(t.facet)}`;
  }
  return `${prefix}/shop/marka/${encodeURIComponent(slug)}`;
}
