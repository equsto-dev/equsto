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

const PSEO_COMBOS = [
  { tr: ["restoran", "istanbul", "modern", "150m2"], en: ["restaurant", "istanbul", "modern", "150m2"] },
  { tr: ["kafe", "istanbul", "ozgun", "80m2"], en: ["cafe", "istanbul", "signature", "80m2"] },
  { tr: ["catering", "istanbul", "klasik", "200m2"], en: ["catering", "istanbul", "classic", "200m2"] },
  { tr: ["steakhouse", "istanbul", "modern", "150m2"], en: ["steakhouse", "istanbul", "modern", "150m2"] },
  { tr: ["bar", "istanbul", "ozgun", "100m2"], en: ["bar", "istanbul", "signature", "100m2"] },
  { tr: ["bulut-mutfak", "istanbul", "modern", "120m2"], en: ["cloud-kitchen", "istanbul", "modern", "120m2"] },
  { tr: ["restoran", "ankara", "modern", "150m2"], en: ["restaurant", "ankara", "modern", "150m2"] },
  { tr: ["kafe", "ankara", "ozgun", "80m2"], en: ["cafe", "ankara", "signature", "80m2"] },
  { tr: ["catering", "ankara", "klasik", "200m2"], en: ["catering", "ankara", "classic", "200m2"] },
  { tr: ["steakhouse", "ankara", "modern", "150m2"], en: ["steakhouse", "ankara", "modern", "150m2"] },
  { tr: ["restoran", "izmir", "modern", "120m2"], en: ["restaurant", "izmir", "modern", "120m2"] },
  { tr: ["kafe", "izmir", "ozgun", "100m2"], en: ["cafe", "izmir", "signature", "100m2"] },
  { tr: ["bar", "izmir", "ozgun", "80m2"], en: ["bar", "izmir", "signature", "80m2"] },
  { tr: ["steakhouse", "izmir", "modern", "150m2"], en: ["steakhouse", "izmir", "modern", "150m2"] },
  { tr: ["restoran", "bursa", "modern", "150m2"], en: ["restaurant", "bursa", "modern", "150m2"] },
  { tr: ["kafe", "bursa", "ozgun", "80m2"], en: ["cafe", "bursa", "signature", "80m2"] },
  { tr: ["catering", "bursa", "klasik", "200m2"], en: ["catering", "bursa", "classic", "200m2"] },
  { tr: ["restoran", "antalya", "modern", "150m2"], en: ["restaurant", "antalya", "modern", "150m2"] },
  { tr: ["kafe", "antalya", "ozgun", "100m2"], en: ["cafe", "antalya", "signature", "100m2"] },
  { tr: ["bar", "antalya", "ozgun", "80m2"], en: ["bar", "antalya", "signature", "80m2"] },
  { tr: ["restoran", "adana", "modern", "150m2"], en: ["restaurant", "adana", "modern", "150m2"] },
  { tr: ["steakhouse", "adana", "modern", "150m2"], en: ["steakhouse", "adana", "modern", "150m2"] },
  { tr: ["restoran", "gaziantep", "modern", "150m2"], en: ["restaurant", "gaziantep", "modern", "150m2"] },
  { tr: ["kafe", "gaziantep", "ozgun", "80m2"], en: ["cafe", "gaziantep", "signature", "80m2"] },
  { tr: ["restoran", "kocaeli", "modern", "150m2"], en: ["restaurant", "kocaeli", "modern", "150m2"] },
  { tr: ["catering", "kocaeli", "klasik", "200m2"], en: ["catering", "kocaeli", "classic", "200m2"] }
];

function buildShopHubs() {
  const urls = [
    urlEntry(`${ORIGIN}/`, { priority: "1", changefreq: "weekly" }),
    urlEntry(`${ORIGIN}/shop`, { priority: "0.95" }),
    urlEntry(`${ORIGIN}/pfos`, { priority: "0.99" }),
    urlEntry(`${ORIGIN}/besos`, { priority: "0.95" }),
    urlEntry(`${ORIGIN}/besos/imt300`, { priority: "0.88" }),
    urlEntry(`${ORIGIN}/arama`, { priority: "0.6" }),
    urlEntry(`${ORIGIN}/shop/marka`, { priority: "0.75" }),
  ];
  for (const d of SHOP_DEPTS) {
    urls.push(urlEntry(`${ORIGIN}/shop/${d}`, { priority: "0.85", changefreq: "weekly" }));
  }
  for (const item of PSEO_COMBOS) {
    const path = `/pfos/${item.tr.join("/")}`;
    urls.push(urlEntry(`${ORIGIN}${path}`, { priority: "0.78", changefreq: "monthly" }));
  }
  return urls;
}

function buildShopEnHubs() {
  const urls = [
    urlEntry(`${ORIGIN}/en/shop`, { priority: "0.93" }),
    urlEntry(`${ORIGIN}/en/shop/marka`, { priority: "0.74" }),
    urlEntry(`${ORIGIN}/en/sepet`, { priority: "0.35", changefreq: "monthly" }),
  ];
  for (const d of SHOP_DEPTS) {
    urls.push(
      urlEntry(`${ORIGIN}/en/shop/${d}`, { priority: "0.84", changefreq: "weekly" }),
    );
  }
  for (const item of PSEO_COMBOS) {
    const path = `/en/pfos/${item.en.join("/")}`;
    urls.push(urlEntry(`${ORIGIN}${path}`, { priority: "0.76", changefreq: "monthly" }));
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
  const seen = new Set();
  const urls = [];
  for (const t of tips) {
    const dept = tipDeptToShop(t.dept);
    if (!SHOP_DEPTS.includes(dept)) continue;
    const key = `${dept}:${t.tip}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const q = `?tip=${encodeURIComponent(t.tip)}`;
    urls.push(
      urlEntry(`${ORIGIN}/shop/${dept}${q}`, { priority: "0.78", changefreq: "weekly" }),
    );
    urls.push(
      urlEntry(`${ORIGIN}/en/shop/${dept}${q}`, { priority: "0.76", changefreq: "weekly" }),
    );
  }
  return urls;
}

function buildBesos() {
  const urls = [
    urlEntry(`${ORIGIN}/besos`, { priority: "0.95" }),
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
  for (const [pathSuffix, priority] of [
    ["/pfos", "0.99"],
    ["/kvkk", "0.5"],
  ]) {
    if (!xml.includes(`https://equsto.com${pathSuffix}</loc>`)) {
      const extra = urlEntry(`${ORIGIN}${pathSuffix}`, {
        priority,
        changefreq: pathSuffix === "/pfos" ? "weekly" : "yearly",
      });
      xml = xml.replace("</urlset>", `${extra}\n</urlset>`);
    }
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
