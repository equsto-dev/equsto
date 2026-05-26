/**
 * ekipmanlar.json → sitemap.xml (statik sayfalar + tüm ürün /shop/{dept}/{slug})
 * Çalıştır: npm run seo:sitemap
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORIGIN,
  LASTMOD,
  categoryToDeptSeg,
  productSlug,
  productPath,
} from "./eq-seo-lib.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "data", "ekipmanlar.json");
const seoDataPath = path.join(root, "public", "data", "eq-category-seo.json");
const outPath = path.join(root, "public", "sitemap.xml");

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(loc, opts = {}) {
  const { priority, changefreq, hreflang } = opts;
  let x = `  <url>\n    <loc>${escXml(loc)}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n`;
  if (changefreq) x += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority != null) x += `    <priority>${priority}</priority>\n`;
  if (hreflang) {
    for (const h of hreflang) {
      x += `    <xhtml:link rel="alternate" hreflang="${escXml(h.lang)}" href="${escXml(h.href)}"/>\n`;
    }
  }
  x += "  </url>\n";
  return x;
}

const staticPages = [
  { loc: `${ORIGIN}/`, priority: 1.0, changefreq: "weekly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/` },
    { lang: "en", href: `${ORIGIN}/en/` },
    { lang: "x-default", href: `${ORIGIN}/` },
  ]},
  { loc: `${ORIGIN}/shop`, priority: 0.95, changefreq: "weekly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/shop` },
    { lang: "en", href: `${ORIGIN}/en/shop` },
    { lang: "x-default", href: `${ORIGIN}/shop` },
  ]},
  { loc: `${ORIGIN}/llms.txt`, priority: 0.55, changefreq: "monthly" },
  { loc: `${ORIGIN}/llms-full.txt`, priority: 0.5, changefreq: "monthly" },
  { loc: `${ORIGIN}/pfos`, priority: 0.99, changefreq: "weekly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/pfos` },
    { lang: "en", href: `${ORIGIN}/en/pfos` },
    { lang: "x-default", href: `${ORIGIN}/pfos` },
  ]},
  { loc: `${ORIGIN}/besos`, priority: 0.99, changefreq: "weekly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/besos` },
    { lang: "en", href: `${ORIGIN}/en/besos` },
    { lang: "x-default", href: `${ORIGIN}/besos` },
  ]},
  { loc: `${ORIGIN}/proje-fabrikasi`, priority: 0.96, changefreq: "weekly" },
  ...["pisirme", "sogutma", "kahve", "yikama", "hazirlik", "icecek"].map((d) => ({
    loc: `${ORIGIN}/shop/${d}`,
    priority: 0.8,
    changefreq: "weekly",
  })),
  { loc: `${ORIGIN}/marka.html`, priority: 0.7, changefreq: "weekly" },
  { loc: `${ORIGIN}/steakhouse-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/steakhouse-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/steakhouse-setup` },
    { lang: "x-default", href: `${ORIGIN}/steakhouse-kurulumu` },
  ]},
  { loc: `${ORIGIN}/bulut-mutfak-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/bulut-mutfak-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/cloud-kitchen-setup` },
    { lang: "x-default", href: `${ORIGIN}/bulut-mutfak-kurulumu` },
  ]},
  { loc: `${ORIGIN}/cafe-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/cafe-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/cafe-setup` },
    { lang: "x-default", href: `${ORIGIN}/cafe-kurulumu` },
  ]},
  { loc: `${ORIGIN}/catering-mutfagi`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/catering-mutfagi` },
    { lang: "en", href: `${ORIGIN}/en/catering-kitchen-setup` },
    { lang: "x-default", href: `${ORIGIN}/catering-mutfagi` },
  ]},
  { loc: `${ORIGIN}/fine-dining-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/fine-dining-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/fine-dining-setup` },
    { lang: "x-default", href: `${ORIGIN}/fine-dining-kurulumu` },
  ]},
  { loc: `${ORIGIN}/all-day-dining-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/all-day-dining-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/all-day-dining-setup` },
    { lang: "x-default", href: `${ORIGIN}/all-day-dining-kurulumu` },
  ]},
  { loc: `${ORIGIN}/fast-food-kurulumu`, priority: 0.85, changefreq: "monthly", hreflang: [
    { lang: "tr", href: `${ORIGIN}/fast-food-kurulumu` },
    { lang: "en", href: `${ORIGIN}/en/fast-food-setup` },
    { lang: "x-default", href: `${ORIGIN}/fast-food-kurulumu` },
  ]},
  { loc: `${ORIGIN}/projeler`, priority: 0.84, changefreq: "monthly" },
  { loc: `${ORIGIN}/projeler/istanbul-yuksek-hacim-catering-demode`, priority: 0.82, changefreq: "monthly" },
  { loc: `${ORIGIN}/projeler/izmir-moduler-bar-icecek-demode`, priority: 0.82, changefreq: "monthly" },
  { loc: `${ORIGIN}/rehber/mutfak-alani-kisi-basi-metrekare-2026`, priority: 0.83, changefreq: "monthly" },
  { loc: `${ORIGIN}/seo/prerender/index.html`, priority: 0.4, changefreq: "weekly" },
];

const items = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const seen = new Set();
let productCount = 0;
let skipped = 0;

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

for (const p of staticPages) {
  xml += urlEntry(p.loc, {
    priority: p.priority,
    changefreq: p.changefreq,
    hreflang: p.hreflang,
  });
}

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function vitrumModuleSlug(p) {
  if (!p) return "";
  if (p.slug) return String(p.slug).trim();
  const raw = p.code || p.name || (p.page != null ? "modul-p" + p.page : "");
  let slug = stripDiacritics(String(raw))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (p.page != null) slug = slug || "modul-p" + p.page;
  return slug;
}

let besosModCount = 0;
const vitrumPath = path.join(root, "public", "data", "vitrum-bars-catalogue.json");
const besosSeen = new Set();
if (fs.existsSync(vitrumPath)) {
  const vitrum = JSON.parse(fs.readFileSync(vitrumPath, "utf8"));
  for (const p of vitrum.products || []) {
    const slug = vitrumModuleSlug(p);
    if (!slug || besosSeen.has(slug)) continue;
    besosSeen.add(slug);
    xml += urlEntry(`${ORIGIN}/besos/modul/${slug}`, {
      priority: 0.92,
      changefreq: "monthly",
    });
    besosModCount++;
  }
}

let facetCount = 0;
const facetSeen = new Set();
if (fs.existsSync(seoDataPath)) {
  const seo = JSON.parse(fs.readFileSync(seoDataPath, "utf8"));
  const facets = [
    ...Object.values(seo.catalogCategories || {}),
    ...Object.values(seo.tips || {}),
  ];
  for (const f of facets) {
    if (!f?.path || facetSeen.has(f.path)) continue;
    facetSeen.add(f.path);
    xml += urlEntry(ORIGIN + f.path, { priority: 0.72, changefreq: "weekly" });
    facetCount++;
  }
}

for (const row of items) {
  if (!row || !row.name) continue;
  const dept = categoryToDeptSeg(row.category);
  if (!dept) {
    skipped++;
    continue;
  }
  const slug = productSlug(row.brand, row.name);
  if (!slug) continue;
  const key = dept + "/" + slug;
  if (seen.has(key)) continue;
  seen.add(key);
  const loc = ORIGIN + productPath(dept, slug);
  xml += urlEntry(loc, { priority: 0.65, changefreq: "weekly" });
  productCount++;
}

xml += "</urlset>\n";
fs.writeFileSync(outPath, xml, "utf8");
console.log(
  `[seo:sitemap] ${outPath} — ${staticPages.length} statik + ${besosModCount} Besos modül + ${facetCount} alt kategori + ${productCount} ürün (${skipped} kategori dışı atlandı)`
);
