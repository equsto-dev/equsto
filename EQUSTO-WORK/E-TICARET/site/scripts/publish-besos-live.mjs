/**
 * Besos katalog + gömülü yedek — görseller public/data/vitrum-drawings (hero/tech PNG).
 *
 *   node scripts/publish-besos-live.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");
const FALLBACK_JS = path.join(ROOT, "public/eq-vitrum-catalogue-fallback.js");
function liveImageUrl(product) {
  const page = product.page;
  if (!page) return product.image || "";
  const hero = `vitrum-drawings/hero_p${page}.png`;
  const tech = `vitrum-drawings/tech_p${page}.png`;
  const heroPath = path.join(ROOT, "public/data", hero);
  if (fs.existsSync(heroPath)) return hero;
  const techPath = path.join(ROOT, "public/data", tech);
  if (fs.existsSync(techPath)) return tech;
  return product.image || "";
}

function liveDrawingUrl(page) {
  if (!page) return "";
  const rel = `vitrum-drawings/tech_p${page}.png`;
  if (fs.existsSync(path.join(ROOT, "public/data", rel))) return rel;
  return "";
}

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
catalogue.livePublishedAt = new Date().toISOString();
catalogue.products = catalogue.products.map((p) => {
  const image = p.image || liveImageUrl(p);
  const drawing = liveDrawingUrl(p.page) || p.drawing || "";
  return {
    ...p,
    image,
    ...(p.image ? { imageLocal: p.image } : {}),
    ...(drawing ? { drawing } : {}),
  };
});

fs.writeFileSync(CATALOGUE, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
fs.writeFileSync(
  FALLBACK_JS,
  "window.__VITRUM_CATALOGUE_FALLBACK=" +
    JSON.stringify(catalogue) +
    ";\n",
  "utf8"
);

console.log("Wrote", CATALOGUE);
console.log("Wrote", FALLBACK_JS, "(" + catalogue.products.length + " products)");
