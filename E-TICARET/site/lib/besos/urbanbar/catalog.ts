import taxonomyJson from "./besos-urbanbar-taxonomy.json";
import type { BesosLocale } from "../locale";
import type {
  BesosUrbanBarCatalog,
  BesosUrbanBarGroup,
  BesosUrbanBarProduct,
  BesosUrbanBarSectionCatalog,
  BesosUrbanBarSectionDef,
  BesosUrbanBarTaxonomy,
} from "./types";

export const BESOS_URBANBAR_TAXONOMY = taxonomyJson as BesosUrbanBarTaxonomy;

export type BesosUrbanBarSectionKey = "bardaklar" | "bar-ekipman";

function normTags(tags?: string[]): string[] {
  return (tags || []).map((t) =>
    String(t || "")
      .trim()
      .toLowerCase()
      .replace(/^cat:/, ""),
  );
}

export function isExcludedFromBesos(product: Pick<BesosUrbanBarProduct, "catTags" | "collections">): boolean {
  const tags = normTags(product.catTags);
  const ex = BESOS_URBANBAR_TAXONOMY.excludeFromBesos;
  if (tags.some((t) => ex.tags.includes(t))) return true;
  const handles = (product.collections || []).map(String);
  return handles.some((h) => ex.collectionHandles.includes(h));
}

export function classifyUrbanBarProduct(
  product: Pick<BesosUrbanBarProduct, "catTags" | "collections" | "name" | "description">,
): { section: BesosUrbanBarSectionKey | null; group: string | null } {
  if (isExcludedFromBesos(product)) return { section: null, group: null };

  const tags = normTags(product.catTags);
  const tagSet = new Set(tags);

  for (const section of BESOS_URBANBAR_TAXONOMY.sections) {
    for (const group of section.groups) {
      if (group.tags.some((t) => tagSet.has(t.toLowerCase()))) {
        return { section: section.key as BesosUrbanBarSectionKey, group: group.key };
      }
    }
  }

  const hay = `${product.name || ""} ${product.description || ""}`.toLowerCase();
  if (/glass|coupe|tumbler|balloon|champagne|wine|beer|shot/.test(hay)) {
    return { section: "bardaklar", group: "glassware" };
  }
  if (/shaker|jigger|spoon|strainer|barware|mixing|ice/.test(hay)) {
    return { section: "bar-ekipman", group: "barware" };
  }
  return { section: null, group: null };
}

function sectionMeta(section: BesosUrbanBarSectionDef, locale: BesosLocale) {
  return {
    label: locale === "en" ? section.labelEn : section.labelTr,
    blurb: locale === "en" ? section.blurbEn : section.blurbTr,
  };
}

function groupLabel(sectionKey: string, groupKey: string, locale: BesosLocale): string {
  const section = BESOS_URBANBAR_TAXONOMY.sections.find((s) => s.key === sectionKey);
  const group = section?.groups.find((g) => g.key === groupKey);
  if (!group) return groupKey;
  return locale === "en" ? group.labelEn : group.labelTr;
}

function sortProducts(items: BesosUrbanBarProduct[]): BesosUrbanBarProduct[] {
  return [...items].sort((a, b) => {
    const na = a.name?.localeCompare(b.name || "", "tr") ?? 0;
    if (na !== 0) return na;
    return (a.code || "").localeCompare(b.code || "", "tr");
  });
}

export function getBesosUrbanBarSection(
  catalog: BesosUrbanBarCatalog,
  sectionKey: BesosUrbanBarSectionKey,
  locale: BesosLocale = "tr",
): BesosUrbanBarSectionCatalog | null {
  const raw = catalog.sections.find((s) => s.key === sectionKey);
  if (!raw) return null;

  const sectionDef = BESOS_URBANBAR_TAXONOMY.sections.find((s) => s.key === sectionKey);
  const meta = sectionDef ? sectionMeta(sectionDef, locale) : { label: sectionKey, blurb: "" };

  const groups: BesosUrbanBarGroup[] = raw.groups.map((g) => {
    const groupDef = sectionDef?.groups.find((x) => x.key === g.key);
    const rawGroup = g as BesosUrbanBarGroup & { labelTr?: string; labelEn?: string };
    const label =
      (locale === "en"
        ? rawGroup.labelEn ?? groupDef?.labelEn
        : rawGroup.labelTr ?? groupDef?.labelTr) ||
      groupDef?.labelTr ||
      g.key;

    return {
      key: g.key,
      slug: g.slug || g.key,
      label,
      items: sortProducts(g.items || []),
    };
  });

  const rawSection = raw as BesosUrbanBarSectionCatalog & {
    labelTr?: string;
    labelEn?: string;
    blurbTr?: string;
    blurbEn?: string;
  };

  return {
    key: raw.key,
    slug: raw.slug,
    label:
      meta.label ||
      (locale === "en" ? rawSection.labelEn : rawSection.labelTr) ||
      sectionKey,
    blurb:
      meta.blurb ||
      (locale === "en" ? rawSection.blurbEn : rawSection.blurbTr) ||
      "",
    productCount: raw.productCount || groups.reduce((n, g) => n + g.items.length, 0),
    groups,
  };
}

export function filterUrbanBarProducts(
  products: BesosUrbanBarProduct[],
  query: string,
): BesosUrbanBarProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) =>
    [p.name, p.code, p.description, p.groupLabelTr, p.groupLabelEn, ...(p.catTags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

const CAPACITY_RE = /(\d+(?:[.,]\d+)?)\s*(cl|ml|oz|lt|l)\b/gi;

/** Ürün adı/açıklamasından kapasite değerleri (20cl, 50ml, 20oz …) */
export function extractUrbanBarCapacities(
  product: Pick<BesosUrbanBarProduct, "name" | "description">,
): string[] {
  const hay = `${product.name || ""} ${product.description || ""}`;
  const out = new Set<string>();
  for (const m of hay.matchAll(CAPACITY_RE)) {
    const val = m[1].replace(",", ".");
    let unit = m[2].toLowerCase();
    if (unit === "l") unit = "lt";
    out.add(`${val}${unit}`);
  }
  return [...out];
}

function capacitySortKey(key: string): number {
  const m = key.match(/^([\d.]+)(cl|ml|oz|lt)$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const unitRank = unit === "cl" ? 0 : unit === "ml" ? 1 : unit === "oz" ? 2 : 3;
  const toCl = unit === "cl" ? n : unit === "ml" ? n / 10 : unit === "oz" ? n * 2.957 : n * 100;
  return unitRank * 1_000_000 + toCl;
}

export function formatUrbanBarCapacityLabel(key: string, locale: BesosLocale): string {
  const m = key.match(/^([\d.]+)(cl|ml|oz|lt)$/i);
  if (!m) return key;
  const num = m[1];
  const unit = m[2].toLowerCase();
  if (locale === "en") return `${num} ${unit}`;
  return `${num} ${unit}`;
}

export type UrbanBarCapacityFacet = {
  key: string;
  label: string;
  count: number;
};

export function buildUrbanBarCapacityFacets(
  products: BesosUrbanBarProduct[],
  locale: BesosLocale = "tr",
): UrbanBarCapacityFacet[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const cap of extractUrbanBarCapacities(p)) {
      counts.set(cap, (counts.get(cap) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: formatUrbanBarCapacityLabel(key, locale),
      count,
    }))
    .sort((a, b) => capacitySortKey(a.key) - capacitySortKey(b.key) || a.key.localeCompare(b.key));
}

export function productMatchesUrbanBarCapacities(
  product: BesosUrbanBarProduct,
  activeCapacities: ReadonlySet<string>,
): boolean {
  if (!activeCapacities.size) return true;
  return extractUrbanBarCapacities(product).some((c) => activeCapacities.has(c));
}

export function groupBesosUrbanBarCatalog(
  products: BesosUrbanBarProduct[],
  locale: BesosLocale = "tr",
): BesosUrbanBarCatalog {
  const bySection: Record<string, Record<string, BesosUrbanBarProduct[]>> = {};

  for (const p of products) {
    if (!p.section || !p.group) continue;
    bySection[p.section] ||= {};
    bySection[p.section][p.group] ||= [];
    bySection[p.section][p.group].push(p);
  }

  const sections: BesosUrbanBarSectionCatalog[] = BESOS_URBANBAR_TAXONOMY.sections
    .map((sectionDef) => {
      const groupsInSection = bySection[sectionDef.key] || {};
      const meta = sectionMeta(sectionDef, locale);
      const groups: BesosUrbanBarGroup[] = sectionDef.groups
        .filter((g) => (groupsInSection[g.key]?.length ?? 0) > 0)
        .map((g) => ({
          key: g.key,
          slug: g.key,
          label: locale === "en" ? g.labelEn : g.labelTr,
          items: sortProducts(groupsInSection[g.key] || []),
        }));

      const productCount = groups.reduce((n, g) => n + g.items.length, 0);
      return {
        key: sectionDef.key,
        slug: sectionDef.slug,
        label: meta.label,
        blurb: meta.blurb,
        productCount,
        groups,
      };
    })
    .filter((s) => s.productCount > 0);

  return {
    brand: BESOS_URBANBAR_TAXONOMY.brand,
    brandSlug: BESOS_URBANBAR_TAXONOMY.brandSlug,
    builtAt: new Date().toISOString(),
    productCount: products.length,
    sections,
    products: sortProducts(products),
  };
}

export function enrichUrbanBarLabels(
  product: BesosUrbanBarProduct,
  locale: BesosLocale = "tr",
): BesosUrbanBarProduct {
  const section = BESOS_URBANBAR_TAXONOMY.sections.find((s) => s.key === product.section);
  return {
    ...product,
    sectionLabelTr: section?.labelTr || product.section,
    sectionLabelEn: section?.labelEn || product.section,
    groupLabelTr: groupLabel(product.section, product.group, "tr"),
    groupLabelEn: groupLabel(product.section, product.group, "en"),
  };
}

export function besosUrbanBarSectionHref(section: BesosUrbanBarSectionKey, locale: BesosLocale): string {
  const base = locale === "en" ? "/en/besos" : "/besos";
  return `${base}/${section === "bardaklar" ? "bardaklar" : "bar-ekipman"}`;
}

export function besosUrbanBarProductSlug(
  product: Pick<BesosUrbanBarProduct, "handle" | "equstoId" | "code">,
): string {
  const handle = String(product.handle || "").trim();
  if (handle) return handle;
  const tail = String(product.equstoId || "")
    .split("__")
    .pop()
    ?.trim();
  if (tail) return tail.toLowerCase();
  return String(product.code || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function besosUrbanBarProductHref(
  section: BesosUrbanBarSectionKey,
  slug: string,
  locale: BesosLocale = "tr",
): string {
  const base = locale === "en" ? "/en/besos" : "/besos";
  const sec = section === "bardaklar" ? "bardaklar" : "bar-ekipman";
  return `${base}/${sec}/${encodeURIComponent(slug)}`;
}

export function pickUrbanBarRelatedProducts(
  catalog: BesosUrbanBarCatalog,
  product: BesosUrbanBarProduct,
  limit = 12,
): BesosUrbanBarProduct[] {
  const sameGroup = catalog.products.filter(
    (p) => p.group === product.group && p.equstoId !== product.equstoId,
  );
  if (sameGroup.length >= limit) return sameGroup.slice(0, limit);
  const sameSection = catalog.products.filter(
    (p) =>
      p.section === product.section &&
      p.equstoId !== product.equstoId &&
      !sameGroup.some((g) => g.equstoId === p.equstoId),
  );
  return [...sameGroup, ...sameSection].slice(0, limit);
}

function translateMaterial(mat: string, locale: BesosLocale): string {
  if (locale === "en") return mat;
  const lower = mat.toLowerCase().trim();
  if (lower === "glass") return "Cam";
  if (lower === "lead free crystal") return "Kurşunsuz Kristal";
  if (lower === "metal") return "Metal";
  if (lower === "steel" || lower === "stainless steel") return "Paslanmaz Çelik";
  if (lower === "plastic") return "Plastik";
  if (lower === "wood") return "Ahşap";
  if (lower === "silicone") return "Silikon";
  if (lower === "paper") return "Kağıt";
  if (lower === "stoneware") return "Seramik";
  if (lower === "cork & metal") return "Mantar ve Metal";
  if (lower === "glass & wicker") return "Hasır ve Cam";
  if (lower === "recycled glass") return "Geri Dönüştürülmüş Cam";
  if (lower === "fabric") return "Kumaş";
  return mat;
}

function formatCollectionLabel(key: string, locale: BesosLocale): string {
  let clean = key
    .replace(/-design$/i, "")
    .replace(/-glassware$/i, "")
    .replace(/-barware$/i, "")
    .replace(/-collection$/i, "")
    .replace(/-/g, " ");
  clean = clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return clean;
}

export type UrbanBarMaterialFacet = {
  key: string;
  label: string;
  count: number;
};

export function buildUrbanBarMaterialFacets(
  products: BesosUrbanBarProduct[],
  locale: BesosLocale = "tr"
): UrbanBarMaterialFacet[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const matSpec = p.specifications?.find((s) => s.key === "Material");
    if (matSpec && matSpec.value) {
      const mat = matSpec.value.trim();
      if (mat) {
        counts.set(mat, (counts.get(mat) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: translateMaterial(key, locale),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function productMatchesUrbanBarMaterial(
  product: BesosUrbanBarProduct,
  activeMaterials: ReadonlySet<string>
): boolean {
  if (!activeMaterials.size) return true;
  const matSpec = product.specifications?.find((s) => s.key === "Material");
  if (!matSpec || !matSpec.value) return false;
  return activeMaterials.has(matSpec.value.trim());
}

export type UrbanBarCollectionFacet = {
  key: string;
  label: string;
  count: number;
};

export function buildUrbanBarCollectionFacets(
  products: BesosUrbanBarProduct[],
  locale: BesosLocale = "tr"
): UrbanBarCollectionFacet[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (p.collections) {
      for (const col of p.collections) {
        const lower = col.toLowerCase();
        if (
          /all|new|b2b|b2c|restricted|favour|fabor|some-of-our|barware|glassware|pos|point-of-sale|branded/i.test(
            lower
          )
        ) {
          continue;
        }
        counts.set(col, (counts.get(col) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: formatCollectionLabel(key, locale),
      count,
    }))
    .filter((c) => c.count > 1)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function productMatchesUrbanBarCollection(
  product: BesosUrbanBarProduct,
  activeCollections: ReadonlySet<string>
): boolean {
  if (!activeCollections.size) return true;
  if (!product.collections) return false;
  return product.collections.some((c) => activeCollections.has(c));
}
