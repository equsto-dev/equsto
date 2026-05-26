/**
 * EQUSTO-SITE-PAKET'e vitrin kritik çıktılarını kopyalar (Bar Design hariç — ayrı kilit).
 * Çalıştır: npm run site:sync-paket
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const paket = path.join(root, "EQUSTO-SITE-PAKET");
const pub = path.join(root, "public");

function copyFile(rel) {
  const s = path.join(pub, ...rel.split("/"));
  const d = path.join(paket, ...rel.split("/"));
  if (!fs.existsSync(s)) {
    console.warn("[site:sync-paket] eksik kaynak:", rel);
    return;
  }
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(s, d);
  console.log("[site:sync-paket]", rel);
}

function copyDir(rel) {
  const s = path.join(pub, ...rel.split("/"));
  const d = path.join(paket, ...rel.split("/"));
  if (!fs.existsSync(s)) {
    console.warn("[site:sync-paket] eksik klasör:", rel);
    return;
  }
  fs.mkdirSync(d, { recursive: true });
  fs.cpSync(s, d, { recursive: true });
  console.log("[site:sync-paket]", rel + "/");
}

if (!fs.existsSync(paket)) {
  console.error("[site:sync-paket] EQUSTO-SITE-PAKET bulunamadı:", paket);
  process.exit(1);
}

const files = [
  "index.html",
  "pfos.html",
  "product.html",
  "contact.html",
  "eq-site-urls.js",
  "eq-pfos-programmatic-seo.js",
  "eq-analytics.js",
  "i18n/en.json",
  "theme.css",
  "theme.js",
  "nav.js",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "llms-full.txt",
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "imt300.html",
  "product.html",
  "eq-category-shell.js",
  "eq-shop-catalog-bootstrap.js",
  "ecom-data.js",
  "ecom-cart.js",
  "equsto-engine.js",
  "equsto-logo.js",
  "equsto-member.js",
  "contact.js",
  "eq-filter-column.js",
  "eq-dept-hero-strip.js",
  "steakhouse-kurulumu.html",
  "bulut-mutfak-kurulumu.html",
  "cafe-kurulumu.html",
  "catering-mutfagi.html",
  "fine-dining-kurulumu.html",
  "all-day-dining-kurulumu.html",
  "fast-food-kurulumu.html",
];
for (const f of files) copyFile(f);
copyDir("projeler");
copyDir("rehber");

console.log("[site:sync-paket] tamam.");
