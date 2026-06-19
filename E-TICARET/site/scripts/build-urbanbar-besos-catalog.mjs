#!/usr/bin/env node
/**
 * Urban Bar → Besos sınıflandırılmış katalog (urbanbar.com PDP detayları dahil)
 * KİLİT: public/besos-urbanbar-images-KILIT.txt
 *   node scripts/build-urbanbar-besos-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyUrbanBarBesos,
  loadUrbanBarBesosTaxonomy,
  sectionDef,
  groupDef,
} from "./lib/urbanbar-besos-taxonomy.mjs";
import { isUrbanBarAlcoholRow } from "./lib/urbanbar-alcohol-filter.mjs";
import { pickUrbanBarPlpHoverUrl } from "./lib/urbanbar-plp-images.mjs";
import { buildUrbanBarRowsFromWeb } from "./lib/urbanbar-equsto-rows.mjs";
import {
  mergeSpecifications,
  parseDescriptionHtml,
  variantFacts,
} from "./lib/parse-urbanbar-pdp-html.mjs";
import { urbanBarUnitPricing } from "./lib/urbanbar-pack-qty.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_CATALOG = path.join(ROOT, "scripts/data/urbanbar/urbanbar-web-catalog.json");
const PDP_DETAILS = path.join(ROOT, "scripts/data/urbanbar/urbanbar-pdp-details.json");
const OUT = path.join(ROOT, "public/data/urbanbar-besos-catalog.json");
const PUBLIC_ROOT = path.join(ROOT, "public");

function localCatalogImageExists(rel) {
  const s = String(rel || "").trim();
  if (!s || /^https?:\/\//i.test(s)) return true;
  const relPath = s.replace(/^\/+/, "");
  return fs.existsSync(path.join(PUBLIC_ROOT, relPath));
}

function loadWebByHandle() {
  const map = new Map();
  if (!fs.existsSync(WEB_CATALOG)) return map;
  const raw = JSON.parse(fs.readFileSync(WEB_CATALOG, "utf8"));
  for (const p of raw.products || []) {
    if (p.handle) map.set(p.handle, p);
  }
  return map;
}

function loadPdpDetailsByHandle() {
  const map = new Map();
  if (!fs.existsSync(PDP_DETAILS)) return map;
  try {
    const raw = JSON.parse(fs.readFileSync(PDP_DETAILS, "utf8"));
    for (const [handle, row] of Object.entries(raw.byHandle || {})) {
      map.set(handle, row);
    }
  } catch (_) {}
  return map;
}

function besosHref(section, handle, equstoId) {
  const slug = handle || String(equstoId || "").split("__").pop() || "";
  const sec = section === "bardaklar" ? "bardaklar" : "bar-ekipman";
  return `/besos/${sec}/${encodeURIComponent(slug)}`;
}

function toProduct(row, taxonomy, webByHandle, pdpByHandle) {
  if (isUrbanBarAlcoholRow(row)) return null;

  const hit = classifyUrbanBarBesos(
    {
      catTags: row.urbanbar_cat_tags,
      urbanbar_cat_tags: row.urbanbar_cat_tags,
      collections: row.urbanbar_collections,
      title: row.name,
      name: row.name,
    },
    taxonomy,
  );
  if (!hit.section || !hit.group) return null;

  const sec = sectionDef(hit.section, taxonomy);
  const grp = groupDef(hit.section, hit.group, taxonomy);

  const handle = row.urbanbar_handle || "";
  const web = handle ? webByHandle.get(handle) : null;
  const pdp = handle ? pdpByHandle.get(handle) : null;

  const descriptionHtml = web?.descriptionHtml || "";
  const parsed = parseDescriptionHtml(descriptionHtml);
  const variant = variantFacts(web?.variants);

  const imageUrls = [];
  if (web?.images?.length) {
    for (const u of web.images) if (u && !imageUrls.includes(u)) imageUrls.push(u);
  } else if (row.shopify_image) {
    imageUrls.push(row.shopify_image);
  } else {
    for (const rel of row.images || []) {
      if (rel && localCatalogImageExists(rel) && !imageUrls.includes(rel)) imageUrls.push(rel);
    }
  }

  const plpHoverImageUrl = pickUrbanBarPlpHoverUrl(imageUrls, imageUrls[0] || "");

  const specifications = mergeSpecifications(
    pdp?.specifications || [],
    variant.variantSpecs || [],
  );

  const unitPx = urbanBarUnitPricing({
    name: row.name,
    code: variant.sku || row.sku || row.model || handle || row.id,
    features: parsed.features,
    description: web?.description || row.aciklama || "",
    specifications,
    fiyat_tl: row.fiyat_tl,
  });

  return {
    id: handle || row.id,
    equstoId: row.id,
    handle,
    code: variant.sku || row.sku || row.model || handle || row.id,
    name: row.name,
    section: hit.section,
    group: hit.group,
    sectionLabelTr: sec?.labelTr || hit.section,
    sectionLabelEn: sec?.labelEn || hit.section,
    groupLabelTr: grp?.labelTr || hit.group,
    groupLabelEn: grp?.labelEn || hit.group,
    description: web?.description || row.aciklama || "",
    descriptionHtml,
    introHtml: parsed.introHtml,
    features: parsed.features,
    featuresHtml: parsed.featuresHtml,
    specifications,
    specificationsHtml: pdp?.specificationsHtml || "",
    productCareHtml: pdp?.productCareHtml || "",
    safetyLabelsHtml: pdp?.safetyLabelsHtml || "",
    inStock: pdp?.inStock ?? variant.available ?? true,
    image: row.images?.[0],
    imageUrl: imageUrls[0] || undefined,
    imageUrls,
    plpHoverImageUrl: plpHoverImageUrl || undefined,
    images: row.images || [],
    price: row.price,
    fiyat_tl: row.fiyat_tl,
    packQty: unitPx?.packQty ?? 1,
    fiyat_tl_birim: unitPx?.unitTl,
    priceGbp: variant.priceGbp ?? row.liste_fiyati_gbp,
    vendor: row.oem_brand || row.brand || web?.vendor,
    catTags: row.urbanbar_cat_tags || web?.catTags || [],
    collections: row.urbanbar_collections || web?.collections?.map((c) => c.handle || c) || [],
    collectionPath: web?.collectionPath || "",
    besosHref: besosHref(hit.section, handle, row.id),
    sourceUrl: web?.url || row.kaynak_url,
  };
}

function groupCatalog(products, taxonomy) {
  const bySection = {};
  for (const p of products) {
    bySection[p.section] ||= {};
    bySection[p.section][p.group] ||= [];
    bySection[p.section][p.group].push(p);
  }

  const sections = taxonomy.sections
    .map((sectionDef) => {
      const groupsInSection = bySection[sectionDef.key] || {};
      const groups = sectionDef.groups
        .filter((g) => (groupsInSection[g.key]?.length ?? 0) > 0)
        .map((g) => ({
          key: g.key,
          slug: g.key,
          labelTr: g.labelTr,
          labelEn: g.labelEn,
          items: groupsInSection[g.key].sort((a, b) => a.name.localeCompare(b.name, "tr")),
        }));

      const productCount = groups.reduce((n, g) => n + g.items.length, 0);
      return {
        key: sectionDef.key,
        slug: sectionDef.slug,
        labelTr: sectionDef.labelTr,
        labelEn: sectionDef.labelEn,
        blurbTr: sectionDef.blurbTr,
        blurbEn: sectionDef.blurbEn,
        productCount,
        groups,
      };
    })
    .filter((s) => s.productCount > 0);

  return sections;
}

async function main() {
  const taxonomy = loadUrbanBarBesosTaxonomy();
  const webByHandle = loadWebByHandle();
  const pdpByHandle = loadPdpDetailsByHandle();
  const { rows } = await buildUrbanBarRowsFromWeb({ root: ROOT, dryRun: true, copyImages: false });
  const products = rows.map((r) => toProduct(r, taxonomy, webByHandle, pdpByHandle)).filter(Boolean);
  const skipped = rows.length - products.length;

  const withSpecs = products.filter((p) => p.specifications?.length).length;
  const withCare = products.filter((p) => p.productCareHtml).length;
  const withFeatures = products.filter((p) => p.features?.length).length;

  const catalog = {
    brand: taxonomy.brand,
    brandSlug: taxonomy.brandSlug,
    builtAt: new Date().toISOString(),
    productCount: products.length,
    sections: groupCatalog(products, taxonomy),
    products,
  };

  fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");

  const bySection = Object.fromEntries(catalog.sections.map((s) => [s.key, s.productCount]));
  console.log(`[urbanbar-besos] ${products.length} ürün → ${OUT}`);
  console.log(`  kaynak satır: ${rows.length}, besos dışı/atlanan: ${skipped}`);
  console.log(`  özellikler: ${withFeatures}, specs: ${withSpecs}, bakım: ${withCare}`);
  console.log(`  pdp önbellek: ${pdpByHandle.size} handle`);
  console.log(`  bölüm:`, bySection);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
