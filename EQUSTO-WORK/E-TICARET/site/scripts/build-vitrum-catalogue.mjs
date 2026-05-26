/**
 * Rebuild public/data/vitrum-bars-catalogue.json from bar-design.html JSON-LD
 * + vitrum-drawings hero_p*.png / tech_p*.png by page number.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "public/bar-design.html");
const DRAWINGS = path.join(ROOT, "public/data/vitrum-drawings");
const OUT = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");

const SLUG_BY_NAME = {
  "The Manhattan": "the-manhattan",
  "The Boulverdier": "the-boulverdier",
  "The Clover": "the-clover",
};

function pageFromSku(sku) {
  const m = String(sku || "").match(/^BES-P(\d+)$/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Non-signature modules: PDF page order (catalog ItemList positions 4–42). */
const PAGE_BY_CATALOG_POSITION = {
  4: 31,
  5: 32,
  6: 33,
  7: 34,
  8: 35,
  9: 36,
  10: 37,
  11: 38,
  12: 39,
  13: 40,
  14: 41,
  15: 42,
  16: 43,
  17: 44,
  18: 45,
  19: 46,
  20: 47,
  21: 48,
  22: 49,
  23: 50,
  24: 51,
  25: 52,
  26: 53,
  27: 54,
  28: 55,
  29: 56,
  30: 57,
  31: 58,
  32: 59,
  33: 60,
  34: 61,
  35: 62,
  36: 63,
  37: 64,
  38: 63,
  39: 63,
  40: 64,
  41: 64,
  42: 64,
};

function hasDrawing(page) {
  return fs.existsSync(path.join(DRAWINGS, `tech_p${page}.png`));
}

function hasHero(page) {
  return fs.existsSync(path.join(DRAWINGS, `hero_p${page}.png`));
}

function parseProducts(html) {
  const start = html.indexOf('"@id": "https://equsto.com/besos#catalog"');
  const slice = start === -1 ? html : html.slice(start);
  const items = [];
  const re =
    /"position":\s*(\d+)[\s\S]*?"name":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"description":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"item":\s*\{[\s\S]*?"@type":\s*"Product"[\s\S]*?"category":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"sku":\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(slice))) {
    items.push({
      position: parseInt(m[1], 10),
      name: JSON.parse(`"${m[2]}"`),
      description: JSON.parse(`"${m[3]}"`),
      category: JSON.parse(`"${m[4]}"`),
      code: JSON.parse(`"${m[5]}"`),
    });
  }
  return items;
}

const html = fs.readFileSync(HTML, "utf8");
const raw = parseProducts(html);
if (raw.length !== 42) {
  console.warn(`Expected 42 products, parsed ${raw.length}`);
}

const products = raw.map((p) => {
  let page = pageFromSku(p.code);
  if (!page && PAGE_BY_CATALOG_POSITION[p.position] != null) {
    page = PAGE_BY_CATALOG_POSITION[p.position];
  }
  const slug = SLUG_BY_NAME[p.name] || undefined;
  let image = page && hasHero(page) ? `vitrum-drawings/hero_p${page}.png` : "";
  if (!image && page && hasDrawing(page)) {
    image = `vitrum-drawings/tech_p${page}.png`;
  }
  const drawing = page && hasDrawing(page) ? `vitrum-drawings/tech_p${page}.png` : "";
  return {
    ...(slug ? { slug } : {}),
    name: p.name,
    code: p.code,
    category: p.category,
    description: p.description,
    page,
    ...(image ? { image } : {}),
    ...(drawing ? { drawing } : {}),
  };
});

const catalogue = {
  source: "bar-design.html ItemList + vitrum-drawings",
  builtAt: new Date().toISOString(),
  products,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(catalogue, null, 2) + "\n", "utf8");

const withImg = products.filter((p) => p.image).length;
console.log(`Wrote ${OUT}`);
console.log(`Products: ${products.length}, with image: ${withImg}`);
