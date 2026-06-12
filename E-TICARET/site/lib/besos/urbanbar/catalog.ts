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
