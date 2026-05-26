/**
 * bar-design.html <head> — geo, TR JSON-LD, EN head switcher (gövdeye dokunmaz)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "public", "bar-design.html");
const ldPath = path.join(root, "public", "data", "eq-besos-seo-ld.json");
const pkgPaths = [
  path.join(root, "EQUSTO-SITE-PAKET", "bar-design.html"),
  path.join(root, "bar-design", "EQUSTO-BAR-DESIGN-PAKET", "bar-design.html"),
  path.join(root, "dist", "bar-design.html"),
];

const geoBlock = `  <meta name="geo.region" content="TR-34">
  <meta name="geo.placename" content="Istanbul, Turkey">
  <meta name="ICBM" content="41.0082, 28.9784">
`;

const ld = JSON.parse(fs.readFileSync(ldPath, "utf8"));
const headSeoBlock =
  `  <!-- Besos SEO/GEO — npm run seo:besos (TR varsayılan; /en/besos → eq-besos-head-seo.js) -->\n` +
  `  <script src="/eq-besos-head-seo-config.js"></script>\n` +
  `  <script type="application/ld+json" id="eq-besos-seo-ld">\n` +
  JSON.stringify(ld, null, 2) +
  `\n  </script>\n` +
  `  <script src="/eq-besos-head-seo.js"></script>\n`;

function patch(file) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("<title>Besos · Bar Design Studio</title>")) {
    console.warn(`[patch-besos] atlandı (Besos değil): ${file}`);
    return false;
  }
  if (!html.includes('name="geo.region"')) {
    html = html.replace(
      '<meta name="format-detection" content="telephone=no">',
      '<meta name="format-detection" content="telephone=no">\n' + geoBlock.trimEnd()
    );
  }
  html = html.replace(
    /\s*<!-- Besos SEO\/GEO[\s\S]*?<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g,
    "\n" + headSeoBlock
  );
  if (!html.includes("eq-besos-head-seo.js")) {
    html = html.replace(
      /<script src="contact\.js" defer><\/script>/,
      '<script src="contact.js" defer></script>\n' + headSeoBlock
    );
  }
  fs.writeFileSync(file, html, "utf8");
  return true;
}

if (!patch(htmlPath)) process.exit(1);
for (const p of pkgPaths) patch(p);
console.log("[patch-besos] head SEO (TR+EN) güncellendi:", htmlPath);
