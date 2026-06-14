/**
 * public/data/dept/*.json → tek public/data/ekipmanlar.json (mağaza + /api/urunler).
 * PFOS/BESOS HTML’e dokunmaz; pfos hâlâ /data/ekipmanlar.json okur (tüm dept birleşimi).
 *
 *   node scripts/rebuild-ekipmanlar-from-dept.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isBarDesignShopProduct } from "./lib/bar-design-shop-exclude.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT = path.join(ROOT, "public/data/ekipmanlar.json");
const META_OUT = path.join(ROOT, "public/data/catalog-meta.json");
const ARCHIVE = path.join(ROOT, "public/data/ekipmanlar-full-archive.json");
const INOKSAN_REPORT = path.join(ROOT, "scripts/data/inoksan-shop-desc-report.json");
const PRODUCTS_EN = path.join(ROOT, "public/data/i18n/products-en-by-id.json");

function rowKey(row) {
  if (row.id) return String(row.id);
  const dept = row.dept || "";
  const sku = row.sku || row.model || "";
  if (sku) return `${dept}__${sku}`;
  return `${dept}__${row.brand || ""}__${row.name || ""}`;
}

const merged = [];
const seen = new Set();

for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (isBarDesignShopProduct(row)) continue;
    const k = rowKey(row);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(row);
  }
}

if (fs.existsSync(OUT) && !fs.existsSync(ARCHIVE)) {
  fs.copyFileSync(OUT, ARCHIVE);
  console.log("[rebuild-ekipmanlar] arşiv:", path.basename(ARCHIVE));
}

const tmp = `${OUT}.tmp-${process.pid}`;
fs.writeFileSync(tmp, JSON.stringify(merged), "utf8");
try {
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
} catch (_) {}
fs.renameSync(tmp, OUT);
console.log("[rebuild-ekipmanlar] yazıldı:", merged.length, "ürün →", path.relative(ROOT, OUT));

const brands = new Set();
const deptCounts = {};
let withImage = 0;
let inoksanComDescriptions = 0;
for (const row of merged) {
  if (row.brand) brands.add(row.brand);
  const dept = row.dept || "unknown";
  deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  if (Array.isArray(row.images) && String(row.images[0] || "").trim()) withImage++;
  if (/inoksan\.com/i.test(String(row.specs || ""))) inoksanComDescriptions++;
}

let inoksanReport = null;
try {
  inoksanReport = JSON.parse(fs.readFileSync(INOKSAN_REPORT, "utf8"));
} catch (_) {}

let productsEnCount = null;
try {
  const en = JSON.parse(fs.readFileSync(PRODUCTS_EN, "utf8"));
  productsEnCount =
    typeof en.count === "number"
      ? en.count
      : en.byId && typeof en.byId === "object"
        ? Object.keys(en.byId).length
        : null;
} catch (_) {}

const rebuiltAt = new Date().toISOString();
const meta = {
  version: rebuiltAt.replace(/[:.]/g, "-").slice(0, 19),
  rebuiltAt,
  ekipmanlar: merged.length,
  withImage,
  brands: brands.size,
  deptCounts,
  inoksanComDescriptions:
    inoksanReport?.inoksanComFallback ?? inoksanComDescriptions,
  inoksanShopDescriptions: inoksanReport?.shopDescriptions ?? 0,
  inoksanMissing: inoksanReport?.missing ?? null,
  productsEnCount,
  productsEnStale:
    productsEnCount != null && productsEnCount < merged.length
      ? merged.length - productsEnCount
      : 0,
};

fs.writeFileSync(META_OUT, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
console.log(
  "[rebuild-ekipmanlar] meta:",
  path.relative(ROOT, META_OUT),
  "— EN:",
  productsEnCount ?? "?",
  productsEnCount != null && productsEnCount < merged.length
    ? `(−${merged.length - productsEnCount} güncel değil)`
    : "",
);
