#!/usr/bin/env node
/**
 * SEO + GEO audit — sitemap kapsamı, meta çakışmaları, entity boşlukları.
 *   node scripts/audit-seo-geo.mjs
 *   npm run seo:audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORIGIN,
  SHOP_DEPTS,
  brandSlugFromName,
  catalogSlug,
  collectExpectedUrls,
  loadDeptTips,
  loadEkipmanlar,
  parseSitemapLocs,
  resolveDept,
  tipDeptToShop,
  uniqueBrandSlugs,
} from "./lib/sitemap-entities.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "scripts", "out");
const OUT_CSV = path.join(OUT_DIR, "seo-geo-audit.csv");
const OUT_JSON = path.join(OUT_DIR, "seo-geo-audit-summary.json");

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(rows) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const header = ["severity", "category", "item", "detail"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([r.severity, r.category, r.item, r.detail].map(csvEscape).join(","));
  }
  fs.writeFileSync(OUT_CSV, lines.join("\n") + "\n", "utf8");
}

function simulateProductTitle(row) {
  const name = String(row.name || "").trim();
  const brand = String(row.brand || "").trim();
  return `${name}${brand ? ` · ${brand}` : ""} · Equsto`;
}

function simulateProductDescription(row) {
  const specs = String(row.specs || "").replace(/\s+/g, " ").trim();
  const slice = specs.slice(0, 155);
  return (
    slice + (specs.length > 155 ? "…" : "") + " Teknik özellikler, fiyat ve teklif."
  );
}

function auditMeta(rows, findings) {
  const titleMap = new Map();
  const descMap = new Map();
  let missingBrand = 0;
  let missingSpecs = 0;
  let missingImage = 0;

  for (const row of rows) {
    const dept = resolveDept(row);
    if (!SHOP_DEPTS.includes(dept)) continue;
    const title = simulateProductTitle(row);
    const desc = simulateProductDescription(row);
    const slug = catalogSlug(row);

    if (!row.brand) missingBrand += 1;
    if (!String(row.specs || "").trim()) missingSpecs += 1;
    if (!row.images || !row.images.length) missingImage += 1;

    if (!titleMap.has(title)) titleMap.set(title, []);
    titleMap.get(title).push(slug);

    if (!descMap.has(desc)) descMap.set(desc, []);
    descMap.get(desc).push(slug);
  }

  for (const [title, slugs] of titleMap) {
    if (slugs.length > 1) {
      findings.push({
        severity: "warn",
        category: "duplicate_title",
        item: title.slice(0, 120),
        detail: `${slugs.length} products: ${slugs.slice(0, 3).join(", ")}${slugs.length > 3 ? "…" : ""}`,
      });
    }
  }

  for (const [desc, slugs] of descMap) {
    if (slugs.length > 3 && desc.length < 40) {
      findings.push({
        severity: "info",
        category: "duplicate_description",
        item: desc.slice(0, 80),
        detail: `${slugs.length} products share thin description`,
      });
    }
  }

  if (missingBrand) {
    findings.push({
      severity: "warn",
      category: "product_data",
      item: "missing_brand",
      detail: `${missingBrand} shop products without brand`,
    });
  }
  if (missingSpecs) {
    findings.push({
      severity: "info",
      category: "product_data",
      item: "missing_specs",
      detail: `${missingSpecs} products without specs (GEO weakness)`,
    });
  }
  if (missingImage) {
    findings.push({
      severity: "warn",
      category: "product_data",
      item: "missing_image",
      detail: `${missingImage} products without images`,
    });
  }
}

function auditSitemap(rows, tips, findings) {
  const expected = collectExpectedUrls(rows, tips);
  const inSitemap = parseSitemapLocs(PUBLIC);

  let missing = 0;
  const missingSamples = [];
  for (const url of expected) {
    if (!inSitemap.has(url)) {
      missing += 1;
      if (missingSamples.length < 25) missingSamples.push(url);
    }
  }

  if (missing) {
    findings.push({
      severity: "error",
      category: "sitemap_gap",
      item: "expected_not_in_sitemap",
      detail: `${missing} URLs missing (sample: ${missingSamples.slice(0, 3).join(" | ")})`,
    });
  } else {
    findings.push({
      severity: "ok",
      category: "sitemap_gap",
      item: "catalog_coverage",
      detail: `All ${expected.size} expected shop entity URLs present in sitemap`,
    });
  }

  let extra = 0;
  const extraSamples = [];
  for (const url of inSitemap) {
    if (!url.startsWith(ORIGIN)) continue;
    if (url.includes("/shop/") && !expected.has(url) && !url.includes("/besos/")) {
      const isLegacyProduct =
        /\/shop\/[^/]+\/[^/?]+$/i.test(url) || /\/en\/shop\/[^/]+\/[^/?]+$/i.test(url);
      const isBesos = url.includes("/besos");
      const isPages = url.includes("/rehber/") || url.includes("/steakhouse") || url.includes("/blog");
      if (isLegacyProduct || isBesos || isPages) continue;
      extra += 1;
      if (extraSamples.length < 10) extraSamples.push(url);
    }
  }

  findings.push({
    severity: "info",
    category: "sitemap_stats",
    item: "total_locs",
    detail: `${inSitemap.size} URLs across sitemap*.xml files`,
  });
}

function auditBrandHubs(rows, findings) {
  const brands = uniqueBrandSlugs(rows);
  findings.push({
    severity: "info",
    category: "entity_brands",
    item: "brand_count",
    detail: `${brands.length} unique brands in catalog`,
  });

  const weak = brands.filter((b) => b.count < 3);
  if (weak.length) {
    findings.push({
      severity: "info",
      category: "entity_brands",
      item: "thin_brands",
      detail: `${weak.length} brands with fewer than 3 products (low hub value)`,
    });
  }

  findings.push({
    severity: "warn",
    category: "entity_brands",
    item: "marka_metadata",
    detail: "Brand pages lack SSR description + Brand JSON-LD (template upgrade pending)",
  });
}

function auditEnCoverage(findings) {
  const inSitemap = parseSitemapLocs(PUBLIC);
  const enShop = [...inSitemap].filter((u) => u.includes("/en/shop/"));
  const trShop = [...inSitemap].filter((u) => u.includes("/shop/") && !u.includes("/en/"));

  findings.push({
    severity: enShop.length ? "ok" : "error",
    category: "en_coverage",
    item: "en_shop_urls",
    detail: `TR shop=${trShop.length} EN shop=${enShop.length} in sitemap`,
  });

  const enPages = [...inSitemap].filter((u) => u.startsWith(`${ORIGIN}/en/`));
  if (enPages.length < 20) {
    findings.push({
      severity: "warn",
      category: "en_coverage",
      item: "en_pillar_gap",
      detail: `Only ${enPages.length} /en/* URLs in sitemap — expand EN GEO pages`,
    });
  }
}

function auditSchemaRoutes(findings) {
  const checks = [
    { route: "app/(shop)/shop/[dept]/[slug]/page.tsx", schema: "Product JSON-LD", status: "ok" },
    { route: "app/(shop)/shop/marka/[slug]/page.tsx", schema: "Brand JSON-LD", status: "missing" },
    { route: "app/(shop)/shop/[dept]/page.tsx", schema: "CollectionPage / ItemList", status: "missing" },
    { route: "components/seo/GlobalSiteJsonLd.tsx", schema: "Organization + WebSite", status: "ok" },
    { route: "rehber/* comparison pages", schema: "FAQPage + Article", status: "missing" },
  ];
  for (const c of checks) {
    findings.push({
      severity: c.status === "ok" ? "ok" : c.status === "missing" ? "warn" : "info",
      category: "schema",
      item: c.route,
      detail: c.schema,
    });
  }
}

function main() {
  const rows = loadEkipmanlar(PUBLIC);
  const tips = loadDeptTips(PUBLIC);
  const findings = [];

  if (!rows.length) {
    findings.push({
      severity: "error",
      category: "data",
      item: "ekipmanlar.json",
      detail: "Catalog empty or missing",
    });
  }

  auditSitemap(rows, tips, findings);
  auditMeta(rows, findings);
  auditBrandHubs(rows, findings);
  auditEnCoverage(findings);
  auditSchemaRoutes(findings);

  writeCsv(findings);

  const summary = {
    generatedAt: new Date().toISOString(),
    catalogProducts: rows.length,
    shopProducts: rows.filter((r) => SHOP_DEPTS.includes(resolveDept(r))).length,
    brandCount: uniqueBrandSlugs(rows).length,
    categoryTips: tips.filter((t) => SHOP_DEPTS.includes(tipDeptToShop(t.dept))).length,
    sitemapUrls: parseSitemapLocs(PUBLIC).size,
    findings: {
      error: findings.filter((f) => f.severity === "error").length,
      warn: findings.filter((f) => f.severity === "warn").length,
      info: findings.filter((f) => f.severity === "info").length,
      ok: findings.filter((f) => f.severity === "ok").length,
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2) + "\n", "utf8");

  console.log("[seo:audit] summary", JSON.stringify(summary.findings));
  console.log("[seo:audit] CSV →", OUT_CSV);
  console.log("[seo:audit] JSON →", OUT_JSON);

  const errors = findings.filter((f) => f.severity === "error");
  if (errors.length) {
    console.error("[seo:audit] errors:", errors.map((e) => e.detail).join("; "));
    process.exitCode = 1;
  }
}

main();
