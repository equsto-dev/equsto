/**
 * Öncelikli sayfalar — GSC'ye ayrıca gönderilebilir (küçük, hızlı taranır).
 * npm run seo:sitemap → ana sitemap ile birlikte üretilir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, LASTMOD } from "./eq-seo-lib.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "public", "sitemap-priority.xml");
const vitrumPath = path.join(root, "public", "data", "vitrum-bars-catalogue.json");

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(loc, opts = {}) {
  const { priority = 0.95, changefreq = "weekly", hreflang } = opts;
  let x = `  <url>\n    <loc>${escXml(loc)}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n`;
  x += `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  if (hreflang) {
    for (const h of hreflang) {
      x += `    <xhtml:link rel="alternate" hreflang="${escXml(h.lang)}" href="${escXml(h.href)}"/>\n`;
    }
  }
  x += "  </url>\n";
  return x;
}

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function moduleSlug(p) {
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

const core = [
  { loc: `${ORIGIN}/`, priority: 1, changefreq: "weekly" },
  {
    loc: `${ORIGIN}/pfos`,
    priority: 1,
    changefreq: "weekly",
    hreflang: [
      { lang: "tr", href: `${ORIGIN}/pfos` },
      { lang: "en", href: `${ORIGIN}/en/pfos` },
      { lang: "x-default", href: `${ORIGIN}/pfos` },
    ],
  },
  {
    loc: `${ORIGIN}/en/pfos`,
    priority: 0.99,
    changefreq: "weekly",
    hreflang: [
      { lang: "tr", href: `${ORIGIN}/pfos` },
      { lang: "en", href: `${ORIGIN}/en/pfos` },
      { lang: "x-default", href: `${ORIGIN}/pfos` },
    ],
  },
  {
    loc: `${ORIGIN}/besos`,
    priority: 1,
    changefreq: "weekly",
    hreflang: [
      { lang: "tr", href: `${ORIGIN}/besos` },
      { lang: "en", href: `${ORIGIN}/en/besos` },
      { lang: "x-default", href: `${ORIGIN}/besos` },
    ],
  },
  {
    loc: `${ORIGIN}/en/besos`,
    priority: 0.99,
    changefreq: "weekly",
    hreflang: [
      { lang: "tr", href: `${ORIGIN}/besos` },
      { lang: "en", href: `${ORIGIN}/en/besos` },
      { lang: "x-default", href: `${ORIGIN}/besos` },
    ],
  },
  { loc: `${ORIGIN}/proje-fabrikasi`, priority: 0.97, changefreq: "weekly" },
  { loc: `${ORIGIN}/bar-design.html`, priority: 0.96, changefreq: "weekly" },
  { loc: `${ORIGIN}/shop`, priority: 0.95, changefreq: "weekly" },
  { loc: `${ORIGIN}/market-reyonlari.html`, priority: 0.88, changefreq: "weekly" },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

for (const p of core) {
  xml += urlEntry(p.loc, p);
}

let modCount = 0;
if (fs.existsSync(vitrumPath)) {
  const catalogue = JSON.parse(fs.readFileSync(vitrumPath, "utf8"));
  const seen = new Set();
  for (const p of catalogue.products || []) {
    const slug = moduleSlug(p);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    xml += urlEntry(`${ORIGIN}/besos/modul/${slug}`, {
      priority: 0.93,
      changefreq: "monthly",
    });
    modCount++;
  }
}

xml += "</urlset>\n";
fs.writeFileSync(outPath, xml, "utf8");
console.log(`[seo:sitemap-priority] ${outPath} — ${core.length} çekirdek + ${modCount} Besos modül`);
