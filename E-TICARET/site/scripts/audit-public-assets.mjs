/**
 * index.html ve kritik public dosyalarını denetler.
 *   node scripts/audit-public-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const REQUIRED_ROOT = [
  "theme.css",
  "theme.js",
  "eq-home-mutbex.css",
  "eq-home-decor.css",
  "contact.css",
  "eq-home-vitrin.js",
  "ecom-data.js",
  "eq-vendor-sanitize.js",
  "eq-category-overrides.js",
  "eq-mutbex-chrome.js",
  "eq-product-compare.js",
  "manifest.json",
  "og-cover.jpg",
];

function extractAssets(html) {
  const set = new Set();
  const re = /(?:href|src)=["'](\/[^"'?#]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    const p = m[1];
    if (/\.(css|js|jpg|jpeg|png|webp|svg|gif|json)$/i.test(p)) set.add(p);
  }
  const urlRe = /url\((\/[^)]+)\)/gi;
  while ((m = urlRe.exec(html))) {
    const p = m[1].replace(/['"]/g, "").split("?")[0];
    if (/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(p)) set.add(p);
  }
  return [...set];
}

function existsWebPath(webPath) {
  const rel = webPath.replace(/^\//, "").split("?")[0];
  return fs.existsSync(path.join(PUBLIC, rel));
}

const indexHtml = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const fromIndex = extractAssets(indexHtml);

let missingRequired = 0;
console.log("=== Zorunlu kök dosyalar ===");
for (const f of REQUIRED_ROOT) {
  const ok = fs.existsSync(path.join(PUBLIC, f));
  if (!ok) missingRequired++;
  console.log(ok ? "  OK" : "  EKSIK", f);
}

let missingIndex = 0;
console.log("\n=== index.html yerel varlıkları ===");
for (const p of fromIndex.sort()) {
  if (!existsWebPath(p)) {
    missingIndex++;
    console.log("  EKSIK", p);
  }
}
if (!missingIndex) console.log("  (hepsi diskte)");

console.log(
  "\nÖzet: zorunlu eksik",
  missingRequired,
  "| index.html eksik",
  missingIndex
);
process.exit(missingRequired || missingIndex ? 1 : 0);
