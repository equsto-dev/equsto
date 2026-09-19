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
  hasSellablePrice,
  loadDeptTips,
  loadEkipmanlar,
  resolveDept,
  tipDeptToShop,
  uniqueBrandSlugs,
  SUBCATEGORY_SLUGS,
  buildSubcategoryUrls,
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
  const body = urls
    .map((u) => {
      // urlEntry historically returned raw XML strings; object form is preferred
      if (typeof u === "string") return u;
      return `  <url>
    <loc>${String(u.loc || "").replace(/&/g, "&amp;")}</loc>
    <lastmod>${u.lastmod || TODAY}</lastmod>
    <changefreq>${u.changefreq || "weekly"}</changefreq>
    <priority>${u.priority || "0.7"}</priority>
  </url>`;
    })
    .join("\n");
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

function writeVideoSitemap(file) {
  const videos = [
    {
      loc: `${ORIGIN}/videolar/imt300-berrak-buz`,
      title: "IMT300 ticari berrak buz makinesi",
      description:
        "Skyra IMT300 berrak buz makinesi: kesim gerektirmeden küp, küre, çubuk ve elmas buz.",
      thumbnail: "https://i.ytimg.com/vi/cOVgfu2o4h4/hqdefault.jpg",
      player: "https://www.youtube.com/embed/cOVgfu2o4h4",
      pub: "2024-06-01T00:00:00+00:00",
    },
    {
      loc: `${ORIGIN}/videolar/besos-bar-modulleri`,
      title: "Besos modüler bar hatları",
      description:
        "Besos · Bar Design Studio modüler kokteyl bar istasyonları.",
      thumbnail:
        "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-poster-00001.jpg",
      content:
        "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-transcode.mp4",
      pub: "2026-06-13T00:00:00+00:00",
    },
  ];
  const body = videos
    .map((v) => {
      const player = v.player
        ? `      <video:player_loc>${v.player}</video:player_loc>\n`
        : "";
      const content = v.content
        ? `      <video:content_loc>${v.content}</video:content_loc>\n`
        : "";
      return `  <url>
    <loc>${v.loc}</loc>
    <video:video>
      <video:thumbnail_loc>${v.thumbnail}</video:thumbnail_loc>
      <video:title>${v.title}</video:title>
      <video:description>${v.description}</video:description>
${player}${content}      <video:publication_date>${v.pub}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
  </url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${body}
</urlset>
`;
  fs.writeFileSync(file, xml, "utf8");
}

function writeProductChunks(prefix, productUrls, indexFiles) {
  const chunks = [];
  for (let i = 0; i < productUrls.length; i += PRODUCT_CHUNK) {
    chunks.push(productUrls.slice(i, i + PRODUCT_CHUNK));
  }
  const written = new Set();
  chunks.forEach((chunk, i) => {
    const name = `${prefix}-${String(i + 1).padStart(2, "0")}.xml`;
    writeUrlset(path.join(PUBLIC, name), chunk);
    indexFiles.push(name);
    written.add(name);
  });
  for (const f of fs.readdirSync(PUBLIC)) {
    if (new RegExp(`^${prefix}-\\d+\\.xml$`, "i").test(f) && !written.has(f)) {
      fs.unlinkSync(path.join(PUBLIC, f));
    }
  }
  return productUrls.length;
}

const PSEO_COMBOS = [];

function buildShopHubs() {
  const urls = [
    urlEntry(`${ORIGIN}/`, { priority: "1", changefreq: "weekly" }),
    urlEntry(`${ORIGIN}/shop`, { priority: "0.95" }),
    urlEntry(`${ORIGIN}/shop/marka`, { priority: "0.75" }),
  ];
  for (const d of SHOP_DEPTS) {
    if (d === "dolap") continue;
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
    if (d === "dolap") continue;
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

function urbanBarSectionPath(section) {
  if (section === "bardaklar") return "bardaklar";
  if (section === "bar-ekipman") return "bar-ekipman";
  return "";
}

function urbanBarProductPath(product, lang) {
  const handle = String(product.handle || "").trim();
  const section = urbanBarSectionPath(product.section);
  if (!handle || !section) return "";
  const prefix = lang === "en" ? "/en" : "";
  return `${prefix}/besos/${section}/${encodeURIComponent(handle)}`;
}

function buildBesos() {
  const urls = [];
  const seen = new Set();
  const add = (pathname, opts = {}) => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);
    urls.push(urlEntry(`${ORIGIN}${pathname}`, opts));
  };

  add("/besos", { priority: "0.93" });
  add("/en/besos", { priority: "0.91" });
  add("/besos/bar-istasyonlari", { priority: "0.92", changefreq: "weekly" });
  add("/en/besos/bar-istasyonlari", { priority: "0.9", changefreq: "weekly" });
  add("/besos/bardaklar", { priority: "0.9", changefreq: "weekly" });
  add("/en/besos/bardaklar", { priority: "0.88", changefreq: "weekly" });
  add("/besos/bar-ekipman", { priority: "0.9", changefreq: "weekly" });
  add("/en/besos/bar-ekipman", { priority: "0.88", changefreq: "weekly" });
  add("/besos/imt300", { priority: "0.88" });
  add("/en/besos/imt300", { priority: "0.86" });

  const catPath = path.join(PUBLIC, "data", "vitrum-bars-catalogue.json");
  if (fs.existsSync(catPath)) {
    const data = JSON.parse(fs.readFileSync(catPath, "utf8"));
    const modulSeen = new Set();
    for (const p of data.products || []) {
      const slug = vitrumSlugLocal(p);
      if (!slug || modulSeen.has(slug)) continue;
      modulSeen.add(slug);
      add(`/besos/modul/${encodeURIComponent(slug)}`, { priority: "0.88", changefreq: "monthly" });
      add(`/en/besos/modul/${encodeURIComponent(slug)}`, { priority: "0.86", changefreq: "monthly" });
    }
  }

  const urbanPath = path.join(PUBLIC, "data", "urbanbar-besos-catalog.json");
  if (fs.existsSync(urbanPath)) {
    const urban = JSON.parse(fs.readFileSync(urbanPath, "utf8"));
    for (const p of urban.products || []) {
      const tr = urbanBarProductPath(p, "tr");
      const en = urbanBarProductPath(p, "en");
      if (tr) add(tr, { priority: "0.72", changefreq: "monthly" });
      if (en) add(en, { priority: "0.7", changefreq: "monthly" });
    }
  }

  return urls;
}

function geoLandingPaths() {
  const paths = [];
  const skipKey = (key) =>
    key === "version" ||
    key === "source" ||
    key === "blog" ||
    key === "projeler" ||
    key.startsWith("projeler/") ||
    key === "en/blog";

  const trFile = path.join(ROOT, "lib/geo/landings.json");
  if (fs.existsSync(trFile)) {
    const raw = JSON.parse(fs.readFileSync(trFile, "utf8"));
    for (const key of Object.keys(raw)) {
      if (skipKey(key) || key.startsWith("en/")) continue;
      paths.push(key.startsWith("/") ? key : `/${key}`);
    }
  }

  const enFile = path.join(ROOT, "lib/geo/landings-en.json");
  if (fs.existsSync(enFile)) {
    const raw = JSON.parse(fs.readFileSync(enFile, "utf8"));
    for (const key of Object.keys(raw)) {
      if (skipKey(key)) continue;
      const loc = key.startsWith("en/") ? `/${key}` : key.startsWith("/") ? key : `/en/${key}`;
      if (loc === "/en/blog" || loc === "/en/contact") continue;
      paths.push(loc);
    }
  }

  return [...new Set(paths)];
}

function buildProducts(rows, langPrefix = "") {
  const seen = new Set();
  const urls = [];
  const prefix = langPrefix ? `/en` : "";
  for (const row of rows) {
    const name = String(row.name || "").trim();
    if (!name) continue;
    if (!hasSellablePrice(row)) continue;
    const dept = resolveDept(row);
    if (!SHOP_DEPTS.includes(dept) || dept === "dolap") continue;
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
    "https://equsto.com/en/contact", // kanonik /en/iletisim
    "https://equsto.com/projeler",
    "https://equsto.com/projeler/istanbul-yuksek-hacim-catering-demode",
    "https://equsto.com/projeler/izmir-moduler-bar-icecek-demode",
    "https://equsto.com/en/blog",
  ];
  for (const url of removeUrls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    xml = xml.replace(new RegExp(`<url>[\\s\\S]*?<loc>${escaped}</loc>[\\s\\S]*?</url>\\s*`, 'g'), '');
  }

  const bumpPriority = [
    ["/endustriyel-mutfak-ekipmani-turkiye", "0.94"],
    ["/mutfak-teklif-platformu", "0.94"],
    ["/oztiryakiler-ekipmani-tedarik", "0.92"],
    ["/steakhouse-kurulumu", "0.9"],
    ["/shop/marka/oztiryakiler", "0.88"],
  ];
  for (const [pathSuffix, priority] of bumpPriority) {
    const loc = `https://equsto.com${pathSuffix}</loc>`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    xml = xml.replace(
      new RegExp(`(<loc>${loc}[\\s\\S]*?<priority>)[0-9.]+(</priority>)`),
      `$1${priority}$2`,
    );
  }

  // Ensure correct final URLs are present
  const ensure = [
    ["/pfos", "0.99", "weekly"],
    ["/kvkk", "0.5", "yearly"],
    ["/en", "0.95", "weekly"],
    ["/en/about", "0.78", "monthly"],
    ["/en/pfos", "0.95", "weekly"],
    ["/en/iletisim", "0.7", "monthly"],
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
    ["/restoran-mutfagi", "0.86", "monthly"],
    ["/en/restoran-mutfagi", "0.86", "monthly"],
    ["/besos", "0.93", "weekly"],
    ["/en/besos", "0.91", "weekly"],
    ["/iletisim", "0.8", "monthly"],
    ["/sss", "0.7", "monthly"],
    ["/en/sss", "0.68", "monthly"],
    ["/rehber", "0.78", "weekly"],
    ["/iade-politikasi", "0.5", "yearly"],
    ["/sartlar", "0.5", "yearly"],
    ["/kariyer", "0.55", "monthly"],
    ["/export", "0.7", "monthly"],
    ["/banka-bilgileri", "0.45", "yearly"],
    ["/buradan-basladi", "0.7", "monthly"],
    ["/en/story", "0.68", "monthly"],
    ["/videolar", "0.8", "weekly"],
    ["/videolar/imt300-berrak-buz", "0.78", "monthly"],
    ["/videolar/besos-bar-modulleri", "0.78", "monthly"],
  ];

  for (const geoPath of geoLandingPaths()) {
    ensure.push([geoPath, "0.8", "monthly"]);
  }

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
    if (/^sitemap-shop-products-en-\d+\.xml$/i.test(f)) {
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
  if (categoryUrls.length) {
    writeUrlset(path.join(PUBLIC, "sitemap-shop-categories.xml"), categoryUrls);
    indexFiles.push("sitemap-shop-categories.xml");
  }

  const besosUrls = buildBesos();
  writeUrlset(path.join(PUBLIC, "sitemap-besos.xml"), besosUrls);
  indexFiles.push("sitemap-besos.xml");

  writeVideoSitemap(path.join(PUBLIC, "sitemap-videos.xml"));
  indexFiles.push("sitemap-videos.xml");

  // Subcategory landing pages
  const subcategoryUrls = buildSubcategoryUrls();
  const subcategoryCount = writeProductChunks("sitemap-shop-subcategories", subcategoryUrls, indexFiles);

  removeLegacyProductSitemaps();

  const productUrlsTr = buildProducts(rows, "");
  const productCountTr = writeProductChunks("sitemap-shop-products", productUrlsTr, indexFiles);
  const productCountEn = 0;

  writeSitemapIndex(indexFiles);
  patchSitemapPages();

  const brands = uniqueBrandSlugs(rows).length;
  console.log(
    [
      "[build-sitemap] done",
      `indexFiles=${indexFiles.length}`,
      `brands=${brands} (${brandUrls.length} urls)`,
      `categories=${categoryUrls.length / 2} tips (${categoryUrls.length} urls)`,
      `subcategories=${subcategoryCount / 2} (${subcategoryCount} urls)`,
      `besos=${besosUrls.length}`,
      `products_tr=${productCountTr}`,
      `products_en=${productCountEn}`,
    ].join(" | "),
  );
}

main();
