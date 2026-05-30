/**
 * Site haritası — sitemap index + parçalı ürün dosyaları.
 * ?tip= filtre URL'leri ve marka.html hariç.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const ORIGIN = "https://equsto.com";
const TODAY = new Date().toISOString().slice(0, 10);
const PRODUCT_CHUNK = 2000;

const SHOP_DEPTS = [
  "pisirme",
  "sogutma",
  "kahve",
  "yikama",
  "hazirlik",
  "icecek",
  "tezgah",
  "dolap",
  "davlumbaz",
  "tasima",
  "araba",
  "istif",
  "set-ustu-mutfak",
  "kuvetler",
  "market-reyonlari",
];

function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i");
}

function slugifyPart(s) {
  return foldTr(s)
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function catalogSlug(row) {
  const id = String(row.id || "").trim();
  if (id) return id.toLowerCase();
  const b = slugifyPart(row.brand);
  const n = slugifyPart(row.name);
  return (b ? `${b}-` : "") + n;
}

function resolveDept(row) {
  let d = String(row.dept || "").trim().toLowerCase();
  if (d === "market-reyon") return "market-reyonlari";
  return d;
}

function urlEntry(loc, opts = {}) {
  const { priority = "0.7", changefreq = "weekly", lastmod = TODAY } = opts;
  return `  <url>
    <loc>${loc}</loc>
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

function vitrumSlug(p) {
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

function loadEkipmanlar() {
  const p = path.join(PUBLIC, "data", "ekipmanlar.json");
  if (!fs.existsSync(p)) {
    console.warn("[build-sitemap] ekipmanlar.json yok, ürün URL atlanıyor");
    return [];
  }
  const rows = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(rows) ? rows : [];
}

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
  return urls;
}

function buildBesos() {
  const urls = [urlEntry(`${ORIGIN}/besos`, { priority: "0.95" })];
  const catPath = path.join(PUBLIC, "data", "vitrum-bars-catalogue.json");
  if (!fs.existsSync(catPath)) return urls;
  const data = JSON.parse(fs.readFileSync(catPath, "utf8"));
  const products = data.products || [];
  const seen = new Set();
  for (const p of products) {
    const slug = vitrumSlug(p);
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

function buildProducts(rows) {
  const seen = new Set();
  const urls = [];
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
      urlEntry(`${ORIGIN}/shop/${dept}/${encodeURIComponent(slug)}`, {
        priority: "0.72",
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
  fs.writeFileSync(pagesPath, xml, "utf8");
}

function main() {
  const rows = loadEkipmanlar();
  const indexFiles = ["sitemap-pages.xml"];

  writeUrlset(path.join(PUBLIC, "sitemap-shop-hubs.xml"), buildShopHubs());
  indexFiles.push("sitemap-shop-hubs.xml");

  writeUrlset(path.join(PUBLIC, "sitemap-besos.xml"), buildBesos());
  indexFiles.push("sitemap-besos.xml");

  const productUrls = buildProducts(rows);
  const chunks = [];
  for (let i = 0; i < productUrls.length; i += PRODUCT_CHUNK) {
    chunks.push(productUrls.slice(i, i + PRODUCT_CHUNK));
  }
  if (!chunks.length) chunks.push([]);
  chunks.forEach((chunk, i) => {
    const name = `sitemap-products-${String(i + 1).padStart(2, "0")}.xml`;
    writeUrlset(path.join(PUBLIC, name), chunk);
    indexFiles.push(name);
  });

  writeSitemapIndex(indexFiles);
  patchSitemapPages();

  console.log(
    `[build-sitemap] index=${indexFiles.length} files, products=${productUrls.length}, chunks=${chunks.length}`,
  );
}

main();
