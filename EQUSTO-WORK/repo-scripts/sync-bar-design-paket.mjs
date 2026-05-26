/**
 * public/ → bar-design/EQUSTO-BAR-DESIGN-PAKET (Besos paketi güncel kalsın)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const paket = path.join(root, "bar-design", "EQUSTO-BAR-DESIGN-PAKET");

const files = [
  "bar-design.html",
  "theme.css",
  "theme.js",
  "nav.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "equsto-logo.js",
  "equsto-member.js",
  "ecom-cart.js",
  "contact.css",
  "contact.js",
  "i18n/tr.json",
  "i18n/en.json",
  "data/vitrum-bars-catalogue.json",
];

function copyRel(rel) {
  const s = path.join(pub, ...rel.split("/"));
  const d = path.join(paket, ...rel.split("/"));
  if (!fs.existsSync(s)) {
    console.warn("[bar-design:sync-paket] eksik:", rel);
    return;
  }
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(s, d);
  console.log("[bar-design:sync-paket]", rel);
}

if (!fs.existsSync(paket)) {
  console.error("[bar-design:sync-paket] klasör yok:", paket);
  process.exit(1);
}

for (const f of files) copyRel(f);

const imgSrc = path.join(pub, "images", "imt300");
const imgDst = path.join(paket, "images", "imt300");
if (fs.existsSync(imgSrc)) {
  fs.mkdirSync(imgDst, { recursive: true });
  fs.cpSync(imgSrc, imgDst, { recursive: true });
  console.log("[bar-design:sync-paket] images/imt300/");
}

console.log("[bar-design:sync-paket] tamam (ekipmanlar.json ayrı — tam site build ile gider).");
