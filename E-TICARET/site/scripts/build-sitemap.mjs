/**
 * Site haritası — entity katmanlı sitemap index.
 *   node scripts/build-sitemap.mjs
 *   npm run sitemap:build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORIGIN,
  SHOP_DEPTS,
  catalogSlug,
  loadDeptTips,
  loadEkipmanlar,
  resolveDept,
  tipDeptToShop,
  uniqueBrandSlugs,
} from "./lib/sitemap-entities.mjs";
import { MARKA_HUB_SLUGS } from "./lib/brand-hub-slugs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const TODAY = new Date().toISOString().slice(0, 10);
const PRODUCT_CHUNK = 2000;

function vitrumSlugLocal(p) {
  if (p.slug) return String(p.slug).trim().toLowerCase();
  const raw = p.code || p.name || (p.page != null ? `modul-p${p.page}` : "");
  let slug = String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (p.page != null) slug = slug || `modul-p${p.page}`;
  return slug;
}

function urlEntry(loc, opts = {}) {
  const { priority = "0.7", changefreq = "weekly", lastmod = TODAY } = opts;
  const esc = loc.replace(/&/g, "&amp;");
  return `  <url>
    <loc>${esc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function writeUrlset(file, urls) {
  const body = urls.join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  fs.writeFileSync(file, xml, "utf8");
}

function writeSitemapIndex(files) {
  const entries = files
    .map(
      (f) => `  <sitemap>
    <loc>${ORIGIN}/${f}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
  fs.writeFileSync(path.join(PUBLIC, "sitemap.xml"), xml, "utf8");
}

function writeProductChunks(prefix, productUrls, indexFiles) {
  const chunks = [];
  for (let i = 0; i < productUrls.length; i += PRODUCT_CHUNK) {
    chunks.push(productUrls.slice(i, i + PRODUCT_CHUNK));
  }
  if (!chunks.length) chunks.push([]);
  chunks.forEach((chunk, i) => {
    const name = `${prefix}-${String(i + 1).padStart(2, "0")}.xml`;
    writeUrlset(path.join(PUBLIC, name), chunk);
    indexFiles.push(name);
  });
  return productUrls.length;
}

const PSEO_COMBOS = [];

function buildShopHubs() {
  const urls = [
    urlEntry(`${ORIGIN}/`, { priority: "1", changefreq: "weekly" }),
    urlEntry(`${ORIGIN}/shop`, { priority: "0.95" }),
    urlEntry(`${ORIGIN}/besos/imt300`, { priority: "0.88" }),
    urlEntry(`${ORIGIN}/shop/marka`, { priority: "0.75" }),
  ];
  for (const d of SHOP_DEPTS) {
    urls.push(urlEntry(`${ORIGIN}/shop/${d}`, { priority: "0.85", changefreq: "weekly" }));
  }
  return urls;
}

function buildShopEnHubs() {
  const urls = [
    urlEntry(`${ORIGIN}/en/shop`, { priority: "0.93" }),
    urlEntry(`${ORIGIN}/en/shop/marka`, { priority: "0.74" }),
  ];
  for (const d of SHOP_DEPTS) {
    urls.push(
      urlEntry(`${ORIGIN}/en/shop/${d}`, { priority: "0.84", changefreq: "weekly" }),
    );
  }
  return urls;
}

function buildBrands(rows) {
  const urls = [];
  const seen = new Set();
  for (const slug of MARKA_HUB_SLUGS) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    urls.push(
      urlEntry(`${ORIGIN}/shop/marka/${encodeURIComponent(slug)}`, {
        priority: "0.8",
        changefreq: "weekly",
      }),
    );
    urls.push(
      urlEntry(`${ORIGIN}/en/shop/marka/${encodeURIComponent(slug)}`, {
        priority: "0.78",
        changefreq: "weekly",
      }),
    );
  }
  for (const { slug } of uniqueBrandSlugs(rows)) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    urls.push(
      urlEntry(`${ORIGIN}/shop/marka/${encodeURIComponent(slug)}`, {
        priority: "0.8",
        changefreq: "weekly",
      }),
    );
    urls.push(
      urlEntry(`${ORIGIN}/en/shop/marka/${encodeURIComponent(slug)}`, {
        priority: "0.78",
        changefreq: "weekly",
      }),
    );
  }
  return urls;
}

function buildCategories(tips) {
  // Filter URLs (?tip=...) are filter states, not indexable landing pages.
  // They canonical to parent department and should not be in sitemap.
  // Return empty array to exclude them from sitemap.
  return [];
}

function buildBesos() {
  const urls = [
    urlEntry(`${ORIGIN}/besos/bar-istasyonlari`, { priority: "0.92", changefreq: "weekly" }),
  ];
  const catPath = path.join(PUBLIC, "data", "vitrum-bars-catalogue.json");
  if (!fs.existsSync(catPath)) return urls;
  const data = JSON.parse(fs.readFileSync(catPath, "utf8"));
  const products = data.products || [];
  const seen = new Set();
  for (const p of products) {
    const slug = vitrumSlugLocal(p);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    urls.push(
      urlEntry(`${ORIGIN}/besos/modul/${encodeURIComponent(slug)}`, {
        priority: "0.88",
        changefreq: "monthly",
      }),
    );
  }
  return urls;
}

function buildProducts(rows, langPrefix = "") {
  const seen = new Set();
  const urls = [];
  const prefix = langPrefix ? `/en` : "";
  for (const row of rows) {
    const name = String(row.name || "").trim();
    if (!name) continue;
    const dept = resolveDept(row);
    if (!SHOP_DEPTS.includes(dept)) continue;
    const slug = catalogSlug(row);
    if (!slug) continue;
    const key = `${dept}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(
      urlEntry(`${ORIGIN}${prefix}/shop/${dept}/${encodeURIComponent(slug)}`, {
        priority: langPrefix ? "0.7" : "0.72",
        changefreq: "monthly",
      }),
    );
  }
  return urls;
}

function patchSitemapPages() {
  const pagesPath = path.join(PUBLIC, "sitemap-pages.xml");
  if (!fs.existsSync(pagesPath)) return;
  let xml = fs.readFileSync(pagesPath, "utf8");
  xml = xml.replace(
    /<loc>https:\/\/equsto\.com\/hakkimizda\.html<\/loc>/,
    "<loc>https://equsto.com/hakkimizda</loc>",
  );
  if (!xml.includes("https://equsto.com/hakkimizda</loc>")) {
    const extra = urlEntry(`${ORIGIN}/hakkimizda`, { priority: "0.75" });
    xml = xml.replace("</urlset>", `${extra}\n</urlset>`);
  }

  // Remove noindex/redirect URLs from sitemap
  const removeUrls = [
    "https://equsto.com/arama",      // noindex
    "https://equsto.com/en/cart",    // redirects to /sepet, noindex
    "https://equsto.com/en/search",  // redirects to /arama, noindex
    "https://equsto.com/en/iletisim", // redirects to /en/contact
    // Missing canonical
    "https://equsto.com/projeler",
    "https://equsto.com/projeler/istanbul-yuksek-hacim-catering-demode",
    "https://equsto.com/projeler/izmir-moduler-bar-icecek-demode",
    "https://equsto.com/en/blog",
    "https://equsto.com/besos",
    "https://equsto.com/en/besos",
  ];
  for (const url of removeUrls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match multiline format: <url>\n    <loc>...</loc>\n    ...\n  </url>
    xml = xml.replace(new RegExp(`<url>[\\s\\S]*?<loc>${escaped}</loc>[\\s\\S]*?</url>\\s*`, 'g'), '');
  }

  // Ensure correct final URLs are present
  const ensure = [
    ["/pfos", "0.99", "weekly"],
    ["/kvkk", "0.5", "yearly"],
    ["/en", "0.95", "weekly"],
    ["/en/about", "0.78", "monthly"],
    ["/en/pfos", "0.95", "weekly"],
    ["/en/contact", "0.7", "monthly"],
    ["/en/steakhouse-kitchen-setup", "0.85", "monthly"],
    ["/en/fish-restaurant-kitchen-project-and-equipment", "0.84", "monthly"],
    ["/en/cloud-kitchen-setup", "0.84", "monthly"],
    ["/en/cafe-setup", "0.84", "monthly"],
    ["/en/catering-kitchen", "0.84", "monthly"],
    ["/en/fast-food-kitchen-setup", "0.82", "monthly"],
    ["/en/fine-dining-kitchen-setup", "0.82", "monthly"],
    ["/en/all-day-dining-kitchen-setup", "0.82", "monthly"],
    ["/en/all-day-casual-cafe-setup", "0.82", "monthly"],
    ["/en/market-butcher-deli-setup", "0.82", "monthly"],
    ["/en/world-cuisine-kitchen-setup", "0.82", "monthly"],
    ["/en/italian-restaurant-kitchen-setup", "0.82", "monthly"],
    ["/en/industrial-kitchen-equipment-turkey", "0.88", "monthly"],
    ["/en/industrial-kitchen-supplier-turkey", "0.88", "monthly"],
    ["/en/commercial-kitchen-quotation", "0.88", "monthly"],
    ["/en/restaurant-kitchen-quote", "0.86", "monthly"],
    ["/en/hotel-kitchen-equipment", "0.84", "monthly"],
    ["/en/oztiryakiler-equipment-supply", "0.84", "monthly"],
    ["/en/cold-room-quote", "0.8", "monthly"],
    ["/en/deli-counter-refrigeration", "0.78", "monthly"],
    ["/en/industrial-cooking-equipment", "0.82", "monthly"],
    ["/en/kitchen-quote-platform", "0.86", "monthly"],
    ["/en/bar-design-turkey", "0.82", "monthly"],
  ];

  for (const [pathSuffix, priority, changefreq] of ensure) {
    if (xml.includes(`https://equsto.com${pathSuffix}</loc>`)) continue;
    const extra = urlEntry(`${ORIGIN}${pathSuffix}`, { priority, changefreq });
    xml = xml.replace("</urlset>", `${extra}\n</urlset>`);
  }

  fs.writeFileSync(pagesPath, xml, "utf8");
}

function removeLegacyProductSitemaps() {
  for (const f of fs.readdirSync(PUBLIC)) {
    if (/^sitemap-products-\d+\.xml$/i.test(f)) {
      fs.unlinkSync(path.join(PUBLIC, f));
    }
  }
}

function main() {
  const rows = loadEkipmanlar(PUBLIC);
  const tips = loadDeptTips(PUBLIC);
  const indexFiles = ["sitemap-pages.xml"];

  writeUrlset(path.join(PUBLIC, "sitemap-shop-hubs.xml"), buildShopHubs());
  indexFiles.push("sitemap-shop-hubs.xml");

  writeUrlset(path.join(PUBLIC, "sitemap-shop-en-hubs.xml"), buildShopEnHubs());
  indexFiles.push("sitemap-shop-en-hubs.xml");

  const brandUrls = buildBrands(rows);
  writeUrlset(path.join(PUBLIC, "sitemap-shop-brands.xml"), brandUrls);
  indexFiles.push("sitemap-shop-brands.xml");

  const categoryUrls = buildCategories(tips);
  writeUrlset(path.join(PUBLIC, "sitemap-shop-categories.xml"), categoryUrls);
  indexFiles.push("sitemap-shop-categories.xml");

  writeUrlset(path.join(PUBLIC, "sitemap-besos.xml"), buildBesos());
  indexFiles.push("sitemap-besos.xml");

  removeLegacyProductSitemaps();

  const productUrlsTr = buildProducts(rows, "");
  const productCountTr = writeProductChunks("sitemap-shop-products", productUrlsTr, indexFiles);

  const productUrlsEn = buildProducts(rows, "en");
  const productCountEn = writeProductChunks("sitemap-shop-products-en", productUrlsEn, indexFiles);

  writeSitemapIndex(indexFiles);
  patchSitemapPages();

  const brands = uniqueBrandSlugs(rows).length;
  console.log(
    [
      "[build-sitemap] done",
      `indexFiles=${indexFiles.length}`,
      `brands=${brands} (${brandUrls.length} urls)`,
      `categories=${categoryUrls.length / 2} tips (${categoryUrls.length} urls)`,
      `products_tr=${productCountTr}`,
      `products_en=${productCountEn}`,
    ].join(" | "),
  );
}

main();
