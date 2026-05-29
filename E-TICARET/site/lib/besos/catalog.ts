import type { BesosLocale } from "./locale";
import { vitrumModuleSlug } from "./module-url";
import type { BesosCategoryGroup, BesosProduct } from "./types";

/** Display order on /besos catalogue */
export const BESOS_CATALOG_GROUP_ORDER = [
  "Signature Bar",
  "Bar Module",
  "Modüller",
  "Accessory:Tap",
] as const;

export type BesosCatalogGroupKey = (typeof BESOS_CATALOG_GROUP_ORDER)[number];

/** Tile grid (compact cards) vs editorial row cards */
export const BESOS_TILE_GRID_KEYS: Record<string, true> = {
  Modüller: true,
  "Accessory:Tap": true,
};

const MERGED_MODULE_CATEGORIES = new Set([
  "Mobile Bar Module",
  "Coffee Module",
  "Sink Module",
  "Dishwasher Module",
  "Ice Machine Module",
  "Neutral Module",
  "Corner Module",
]);

const CATEGORY_LABELS: Record<BesosCatalogGroupKey, { label: string; blurb: string }> = {
  "Signature Bar": {
    label: "İmza barlar",
    blurb: "Manhattan, Boulverdier ve Clover — yoğun servis için hazır istasyonlar.",
  },
  "Bar Module": {
    label: "Bar modülleri",
    blurb: "Evye, hız rayı ve saklama alanlarıyla modüler bar hatları.",
  },
  Modüller: {
    label: "Modüller",
    blurb: "Mobil bar, lavabo, kahve, bulaşık, buz, nötr ve köşe modülleri.",
  },
  "Accessory:Tap": {
    label: "Musluklar",
    blurb: "Profesyonel bar muslukları ve aksesuarlar.",
  },
};

const CATEGORY_LABELS_EN: Record<BesosCatalogGroupKey, { label: string; blurb: string }> = {
  "Signature Bar": {
    label: "Signature bars",
    blurb: "Manhattan, Boulverdier and Clover — ready-to-run stations for peak service.",
  },
  "Bar Module": {
    label: "Bar modules",
    blurb: "Modular bar lines with sinks, speed rails and storage.",
  },
  Modüller: {
    label: "Modules",
    blurb: "Mobile bar, sink, coffee, dishwasher, ice, neutral and corner modules.",
  },
  "Accessory:Tap": {
    label: "Taps",
    blurb: "Professional bar taps and accessories.",
  },
};

function categoryLabels(locale: BesosLocale) {
  return locale === "en" ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
}

export function besosCatalogGroupKey(category: string): BesosCatalogGroupKey | "—" {
  const cat = category?.trim() || "";
  if (cat === "Signature Bar") return "Signature Bar";
  if (cat === "Bar Module") return "Bar Module";
  if (cat === "Accessory:Tap") return "Accessory:Tap";
  if (MERGED_MODULE_CATEGORIES.has(cat)) return "Modüller";
  return "—";
}

function slugCategory(k: string): string {
  return (
    String(k || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "kat"
  );
}

function sortIndex(key: string): number {
  const i = BESOS_CATALOG_GROUP_ORDER.indexOf(key as BesosCatalogGroupKey);
  return i === -1 ? 999 : i;
}

function sortGroupItems(items: BesosProduct[], groupKey: string): BesosProduct[] {
  const list = [...items];
  list.sort((a, b) => {
    const pa = a.page ?? 9999;
    const pb = b.page ?? 9999;
    if (pa !== pb) return pa - pb;
    return a.code.localeCompare(b.code, "tr");
  });
  return list;
}

export function findBesosProduct(
  products: BesosProduct[],
  slugOrCode: string,
): BesosProduct | null {
  const k = slugOrCode.trim().toLowerCase();
  if (!k) return null;
  return (
    products.find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === k) ||
        p.code.toLowerCase() === k ||
        vitrumModuleSlug(p).toLowerCase() === k,
    ) ?? null
  );
}

export function groupBesosCatalogue(
  products: BesosProduct[],
  locale: BesosLocale = "tr",
): BesosCategoryGroup[] {
  const by: Record<string, BesosProduct[]> = {};
  for (const p of products) {
    const k = besosCatalogGroupKey(p.category);
    if (k === "—") continue;
    if (!by[k]) by[k] = [];
    by[k].push(p);
  }

  return Object.keys(by)
    .map((key) => {
      const items = sortGroupItems(by[key], key);
      const labels = categoryLabels(locale);
      const meta = labels[key as BesosCatalogGroupKey] ?? { label: key, blurb: "" };
      return {
        key,
        slug: slugCategory(key),
        label: meta.label,
        blurb: meta.blurb,
        items,
      };
    })
    .sort((a, b) => {
      const oa = sortIndex(a.key);
      const ob = sortIndex(b.key);
      if (oa !== ob) return oa - ob;
      const minA = Math.min(...a.items.map((p) => p.page ?? 9999));
      const minB = Math.min(...b.items.map((p) => p.page ?? 9999));
      return minA - minB;
    });
}

export function filterBesosProducts(
  products: BesosProduct[],
  query: string,
  locale: BesosLocale = "tr",
): BesosProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    const hay = [
      p.name,
      p.code,
      p.slug,
      p.category,
      p.description,
      locale === "en" ? p.descriptionEn : "",
      p.totalDimensionsMm,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Legacy interlude / project panels — raw Vitrum category buckets */
export function besosRawCategoryKey(category: string): string {
  if (category === "Dishwasher Module" || category === "Ice Machine Module") {
    return "Dishwasher & Ice";
  }
  return category || "";
}
