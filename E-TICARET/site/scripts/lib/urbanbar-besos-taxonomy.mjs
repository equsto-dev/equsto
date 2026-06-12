import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TAXONOMY_PATH = path.join(ROOT, "lib/besos/urbanbar/besos-urbanbar-taxonomy.json");

let _cached;
export function loadUrbanBarBesosTaxonomy() {
  if (!_cached) _cached = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
  return _cached;
}

function normTags(tags) {
  return (tags || []).map((t) =>
    String(t || "")
      .trim()
      .toLowerCase()
      .replace(/^cat:/, ""),
  );
}

export function isExcludedFromBesos(product, taxonomy = loadUrbanBarBesosTaxonomy()) {
  const tags = normTags(product.catTags || product.urbanbar_cat_tags || product.tags);
  const ex = taxonomy.excludeFromBesos || {};
  if (tags.some((t) => (ex.tags || []).includes(t))) return true;
  const handles = (product.collections || product.urbanbar_collections || []).map((c) =>
    typeof c === "string" ? c : c.handle,
  );
  if (handles.some((h) => (ex.collectionHandles || []).includes(h))) return true;
  return false;
}

export function classifyUrbanBarBesos(product, taxonomy = loadUrbanBarBesosTaxonomy()) {
  if (isExcludedFromBesos(product, taxonomy)) {
    return { section: null, group: null };
  }

  const tags = normTags(product.catTags || product.urbanbar_cat_tags || product.tags);
  const tagSet = new Set(tags);

  for (const section of taxonomy.sections) {
    for (const group of section.groups) {
      if (group.tags.some((t) => tagSet.has(t.toLowerCase()))) {
        return {
          section: section.key,
          group: group.key,
          sectionDef: section,
          groupDef: group,
        };
      }
    }
  }

  const hay = `${product.title || product.name || ""} ${product.collectionPath || ""}`.toLowerCase();
  if (/glass|coupe|tumbler|balloon|champagne|wine|beer|shot/.test(hay)) {
    const section = taxonomy.sections.find((s) => s.key === "bardaklar");
    const fallback = section?.groups.find((g) => g.key === "glassware");
    return { section: "bardaklar", group: "glassware", sectionDef: section, groupDef: fallback };
  }
  if (/shaker|jigger|spoon|strainer|barware|mixing|ice/.test(hay)) {
    const section = taxonomy.sections.find((s) => s.key === "bar-ekipman");
    const fallback = section?.groups.find((g) => g.key === "barware");
    return { section: "bar-ekipman", group: "barware", sectionDef: section, groupDef: fallback };
  }

  return { section: null, group: null };
}

export function sectionDef(key, taxonomy = loadUrbanBarBesosTaxonomy()) {
  return taxonomy.sections.find((s) => s.key === key) || null;
}

export function groupDef(sectionKey, groupKey, taxonomy = loadUrbanBarBesosTaxonomy()) {
  return sectionDef(sectionKey, taxonomy)?.groups.find((g) => g.key === groupKey) || null;
}
