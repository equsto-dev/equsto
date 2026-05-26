/**
 * localhost:5173 (dist) → canlı — ana sayfa + shop + market reyon (ürün görselleri hariç).
 *   node scripts/pack-dev-canli-deploy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PUB = path.join(ROOT, "public");
const LIST = path.join(ROOT, ".tmp-dev-canli-files.txt");

const ROOT_FILES = [
  ".htaccess",
  "_redirects",
  "index.html",
  "market-reyonlari.html",
  "product.html",
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "tezgah.html",
  "dolap.html",
  "davlumbaz.html",
  "tasima.html",
  "araba.html",
  "istif.html",
  "theme.css",
  "theme.js",
  "nav.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "eq-home-mutbex.css",
  "eq-home-mutbex.js",
  "eq-dept-plp.css",
  "eq-dept-plp.js",
  "eq-dept-cm-facets.js",
  "eq-dept-tips.js",
  "eq-dept-plp-config.js",
  "eq-market-reyon.js",
  "eq-vitrin-config.js",
  "eq-shop-catalog-bootstrap.js",
  "eq-filter-column.js",
  "eq-display-terminology.js",
  "eq-product-card-tint.js",
  "eq-vendor-sanitize.js",
  "eq-header-search.js",
  "eq-footer.js",
  "eq-mutbex-chrome.js",
  "ecom-cart.js",
  "ecom-data.js",
  "contact.css",
  "contact.js",
  "images/equsto-logo.png",
  "images/equsto-logo-white.png",
];

const DATA_FILES = [
  "data/ekipmanlar.json",
  "data/caglayan-market-reyon-catalogue.json",
  "data/fiyatlar.json",
  "data/dept/pisirme.json",
  "data/dept/sogutma.json",
  "data/dept/kahve.json",
  "data/dept/yikama.json",
  "data/dept/hazirlik.json",
  "data/dept/icecek.json",
  "data/dept/tezgah.json",
  "data/dept/dolap.json",
  "data/dept/davlumbaz.json",
  "data/dept/tasima.json",
  "data/dept/araba.json",
  "data/dept/istif.json",
];

function walkAssets(dir, base, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) walkAssets(fp, rel, out);
    else out.push(rel.replace(/\\/g, "/"));
  }
}

const files = new Set();
for (const rel of [...ROOT_FILES, ...DATA_FILES]) {
  if (fs.existsSync(path.join(DIST, rel)) || fs.existsSync(path.join(PUB, rel))) {
    files.add(rel);
  }
}
const assetList = [];
walkAssets(path.join(DIST, "assets"), "assets", assetList);
for (const rel of assetList) files.add(rel);

const imgDir = path.join(PUB, "data", "images");
if (fs.existsSync(imgDir)) {
  for (const ent of fs.readdirSync(imgDir, { withFileTypes: true })) {
    if (ent.isFile() && /^caglayan-/.test(ent.name)) {
      files.add(`data/images/${ent.name}`);
    }
  }
}

const lines = [...files].sort();
fs.writeFileSync(LIST, lines.join("\n") + "\n", "utf8");
console.log(`[pack-dev-canli] ${lines.length} dosya → ${LIST}`);
