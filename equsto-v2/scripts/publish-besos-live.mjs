/**
 * Canlı equsto.com/bar-design için katalog + gömülü yedek üretir.
 * Görseller: vitrumgroup.org CDN + equsto.com/data/vitrum-drawings (zaten canlıda).
 *
 *   node scripts/publish-besos-live.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");
const FALLBACK_JS = path.join(ROOT, "public/eq-vitrum-catalogue-fallback.js");
const SITE = "https://equsto.com";
const CDN = "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d";

const SIGNATURE_URL = {
  "BES-P23": `${CDN}/6797f675c6587180a2de3da2_The_Manhattan_Bar.avif`,
  "BES-P24": `${CDN}/679213166e78e143c7905338_The%20Boulevardier_bar.avif`,
  "BES-P25": `${CDN}/6792131632c0b70a8c552b74_The%20Clover_bar.avif`,
};

function barModuleUrl(n) {
  const suffix = n === 0 ? "bar%20module-0%20" : `bar%20module-${n}`;
  const ids = {
    0: "6790bd324f7cba4550ab6f64",
    1: "6790bd32193fb32b7992f7b6",
    2: "6790bd3209d3d0d6c9bd55bd",
    3: "6790bd32a31e3ddf7a52a225",
    4: "6790bd32d33ae1e2d1552681",
    5: "6790bd8482a7fef92738ba59",
    6: "6790bd32323bae5c9c9659c6",
    7: "6790bd326c8bedb4eb75a61b",
    8: "6790bd336250c18bcd649d0a",
    9: "6790bd32fc7fb3cf6626714a",
    10: "6790bd9703dcdbc60b22b6af",
    11: "6790bd32378ca18fb9c8bb03",
    12: "6790bd33794dfeab7e0b36da",
    13: "6790bd32a50373df9b51d137",
    14: "6790bd32851c2c6ddf78b322",
    15: "6790bd32254c4889d2056e0a",
    16: "6790bd33962ed5245d764e86",
    17: "6790bd3209d3d0d6c9bd55ef",
    18: "6790bd3324cac00b731f95bb",
    19: "6790bd33e88fb5b1d254086e",
  };
  const id = ids[n];
  return id ? `${CDN}/${id}_${suffix}.avif` : "";
}

function liveImageUrl(product, index) {
  const code = product.code;
  if (SIGNATURE_URL[code]) return SIGNATURE_URL[code];
  if (index >= 3 && index <= 22) return barModuleUrl(index - 3);
  const page = product.page;
  if (!page) return "";
  return `${SITE}/data/vitrum-drawings/hero_p${page}.png`;
}

function liveDrawingUrl(page) {
  if (!page) return "";
  return `${SITE}/data/vitrum-drawings/tech_p${page}.png`;
}

const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
catalogue.livePublishedAt = new Date().toISOString();
catalogue.products = catalogue.products.map((p, i) => {
  const image = liveImageUrl(p, i);
  const drawing = liveDrawingUrl(p.page);
  const localImage = p.image;
  return {
    ...p,
    image,
    imageLocal: localImage,
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
