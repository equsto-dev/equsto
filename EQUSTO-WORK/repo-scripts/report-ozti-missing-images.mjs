/**
 * Öztiryakiler: katalogda yazılı ama arşivde / diskte olmayan görseller.
 * Çıktı: public/data/ozti-missing-images.json + .csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyEq } from "./eq-seo-lib.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const OUT_JSON = path.join(ROOT, "public", "data", "ozti-missing-images.json");
const OUT_CSV = path.join(ROOT, "public", "data", "ozti-missing-images.csv");
const OUT_PRODUCTS_CSV = path.join(ROOT, "public", "data", "ozti-missing-products.csv");
const SITE_IMG = path.join(ROOT, "public", "data", "images");
const ARCHIVE_IMG = path.join(ROOT, ".tmp-omer-images", "oztiryakiler", "images");

const OZTI_RE = /öztiryakiler/i;

function basename(rel) {
  return String(rel || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
}

/** Türkçe/Unicode farklarını yumuşat (dosya adı eşleştirme) */
function normFileKey(name) {
  return slugifyEq(
    String(name || "")
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .replace(/i\u0307/g, "i")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ç/g, "c"),
  );
}

function loadArchiveIndex() {
  const byExact = new Map();
  const byNorm = new Map();
  if (!fs.existsSync(ARCHIVE_IMG)) return { byExact, byNorm, files: [] };
  const files = fs.readdirSync(ARCHIVE_IMG).filter((f) => {
    const p = path.join(ARCHIVE_IMG, f);
    return fs.statSync(p).isFile();
  });
  for (const f of files) {
    byExact.set(f.toLowerCase(), f);
    const nk = normFileKey(f.replace(/_\d+\.[a-z]+$/i, ""));
    if (!byNorm.has(nk)) byNorm.set(nk, []);
    byNorm.get(nk).push(f);
  }
  return { byExact, byNorm, files };
}

function findFuzzy(catalogBase, byNorm, archiveFiles) {
  const stem = catalogBase.replace(/_\d+\.[a-z]+$/i, "");
  const nk = normFileKey(stem);
  if (byNorm.has(nk)) return { match: byNorm.get(nk)[0], method: "norm-stem" };

  const slug = slugifyEq(stem);
  for (const f of archiveFiles) {
    const fs2 = slugifyEq(f.replace(/_\d+\.[a-z]+$/i, ""));
    if (fs2 === slug) return { match: f, method: "slugify" };
    if (fs2.length > 20 && (fs2.includes(slug) || slug.includes(fs2))) {
      return { match: f, method: "slugify-partial" };
    }
  }
  return null;
}

function csvEscape(s) {
  const t = String(s ?? "").replace(/"/g, '""');
  return /[",\n\r]/.test(t) ? `"${t}"` : t;
}

const archive = loadArchiveIndex();
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

const missingProducts = [];
const missingFiles = [];
const fuzzyCandidates = [];
let oztiProducts = 0;
let oztiImageSlots = 0;
let onDisk = 0;
let inArchive = 0;
let missing = 0;

for (const p of catalog) {
  if (!OZTI_RE.test(p.brand || "")) continue;
  oztiProducts++;

  const imgs = p.images || [];
  if (!imgs.length) {
    missingProducts.push({
      sku: p.sku || "",
      name: p.name,
      brand: p.brand,
      reason: "images-array-empty",
      missingFiles: [],
    });
    continue;
  }

  const productMissing = [];
  for (const im of imgs) {
    oztiImageSlots++;
    const base = basename(im);
    const sitePath = path.join(SITE_IMG, base);
    const archExact = archive.byExact.get(base.toLowerCase());

    if (fs.existsSync(sitePath) && fs.statSync(sitePath).size > 0) {
      onDisk++;
      continue;
    }
    if (archExact) {
      inArchive++;
      const fuzzy = { catalogFile: base, archiveFile: archExact, method: "archive-exact-not-copied" };
      fuzzyCandidates.push({ ...fuzzy, sku: p.sku, name: p.name });
      productMissing.push(base);
      missingFiles.push({ file: base, sku: p.sku, name: p.name, status: "in-archive-not-on-disk", archiveFile: archExact });
      missing++;
      continue;
    }

    const fuzzy = findFuzzy(base, archive.byNorm, archive.files);
    if (fuzzy) {
      fuzzyCandidates.push({
        catalogFile: base,
        archiveFile: fuzzy.match,
        method: fuzzy.method,
        sku: p.sku,
        name: p.name,
      });
      productMissing.push(base);
      missingFiles.push({
        file: base,
        sku: p.sku,
        name: p.name,
        status: "fuzzy-in-archive",
        archiveFile: fuzzy.match,
        matchMethod: fuzzy.method,
      });
      missing++;
      continue;
    }

    productMissing.push(base);
    missingFiles.push({
      file: base,
      sku: p.sku,
      name: p.name,
      status: "not-in-archive",
      sourceUrl: p.sourceUrl || "",
    });
    missing++;
  }

  if (productMissing.length) {
    missingProducts.push({
      sku: p.sku || "",
      name: p.name,
      brand: p.brand,
      sourceUrl: p.sourceUrl || "",
      missingCount: productMissing.length,
      totalImages: imgs.length,
      missingFiles: productMissing,
    });
  }
}

const notInArchive = missingFiles.filter((x) => x.status === "not-in-archive");
const fixable = missingFiles.filter((x) => x.status !== "not-in-archive");

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    oztiProducts,
    oztiImageSlots,
    onDisk,
    inArchiveNotCopied: missingFiles.filter((x) => x.status === "in-archive-not-on-disk").length,
    fuzzyInArchive: missingFiles.filter((x) => x.status === "fuzzy-in-archive").length,
    notInArchive: notInArchive.length,
    productsWithAnyMissing: missingProducts.length,
    archiveFileCount: archive.files.length,
  },
  notInArchiveProducts: missingProducts.filter((p) =>
    p.missingFiles.some((f) => notInArchive.some((n) => n.file === f && n.sku === p.sku)),
  ),
  fixableCandidates: fuzzyCandidates,
  allMissingFiles: missingFiles,
  missingProducts,
};

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n", "utf8");

const csvLines = [
  "status,sku,name,catalog_file,archive_file,match_method,source_url",
  ...missingFiles.map((r) =>
    [
      r.status,
      r.sku,
      r.name,
      r.file,
      r.archiveFile || "",
      r.matchMethod || "",
      r.sourceUrl || "",
    ]
      .map(csvEscape)
      .join(","),
  ),
];
fs.writeFileSync(OUT_CSV, csvLines.join("\n") + "\n", "utf8");

const productLines = [
  "sku,name,missing_files,total_images,source_url",
  ...missingProducts.map((p) =>
    [p.sku, p.name, p.missingFiles.join(" | "), p.totalImages, p.sourceUrl || ""]
      .map(csvEscape)
      .join(","),
  ),
];
fs.writeFileSync(OUT_PRODUCTS_CSV, productLines.join("\n") + "\n", "utf8");

const uniqueNotInArchive = new Set(
  notInArchive.map((x) => x.file),
);
report.summary.uniqueFilesNotInArchive = uniqueNotInArchive.size;

console.log(JSON.stringify(report.summary, null, 2));
console.log("JSON:", OUT_JSON);
console.log("CSV (dosya):", OUT_CSV);
console.log("CSV (ürün):", OUT_PRODUCTS_CSV);
console.log(
  "Arşivde hiç yok:",
  report.notInArchiveProducts.length,
  "ürün,",
  uniqueNotInArchive.size,
  "benzersiz dosya adı",
);
