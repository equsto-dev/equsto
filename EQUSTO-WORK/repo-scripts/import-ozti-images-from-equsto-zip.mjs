/**
 * Equsto-20260516 ZIP → site katalog görselleri (Öztiryakiler).
 * Kaynak: Downloads ZIP içindeki ekipmanlar.json + images.7z
 * Hedef: public/data/images/ (+ dist) — mevcut dosya adları korunur (ekipmanlar.json yolları).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { slugifyEq } from "./eq-seo-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const ZIP_PATH =
  process.argv.find((a) => a.endsWith(".zip")) ||
  path.join(
    process.env.USERPROFILE || "",
    "Downloads",
    "Equsto-20260516T113705Z-3-002.zip"
  );
const TMP = path.join(ROOT, ".tmp-ozti-import");
const JSON_PATH = path.join(TMP, "Equsto", "Öztiryakiler", "ekipmanlar.json");
const ARCHIVE_7Z = path.join(TMP, "Equsto", "Öztiryakiler", "images.7z");
const IMAGES_SRC = path.join(TMP, "images-extracted", "images");
const SITE_JSON = path.join(ROOT, "public", "data", "ekipmanlar.json");
const OUT_IMAGES = path.join(ROOT, "public", "data", "images");
const DIST_IMAGES = path.join(ROOT, "dist", "data", "images");
const REPORT = path.join(ROOT, "public", "data", "ozti-image-import-report.json");

const OZTI_BRAND_RE = /öztiryakiler/i;

function normCode(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function basename(rel) {
  return String(rel || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
}

function extractCodes(text) {
  const codes = new Set();
  const s = String(text || "");
  // 7ETA.21C20.SS · 7911.N1.40903.00 · 8864.07050.02 · 9580.EM650.00
  for (const m of s.matchAll(/\b([\d][\dA-Za-z]{0,3}(?:\.[\dA-Za-z][\dA-Za-z.]*){2,})\b/g)) {
    codes.add(normCode(m[1]));
  }
  for (const m of s.matchAll(/\b(\d{4}\.[\dA-Za-z]{2,}\.[\dA-Za-z]{2,})\b/g)) {
    codes.add(normCode(m[1]));
  }
  for (const m of s.matchAll(/\b(\d{2,4}[A-Za-z]\d[\w]*(?:\.[\w]+){0,4})\b/g)) {
    const c = normCode(m[1]);
    if (c.length >= 8) codes.add(c);
  }
  // Model: OBY500TOUCH, OPS04, EF708, CB699-D
  for (const m of s.matchAll(/\b([A-Z]{2,3}\d{2,5}[A-Z]{0,6})\b/g)) {
    codes.add(normCode(m[1]));
  }
  return [...codes];
}

function lookupByCode(c, byCode) {
  if (byCode.has(c)) return byCode.get(c);
  if (c.length >= 11) {
    const pref = c.slice(0, -2);
    for (const [k, v] of byCode) {
      if (k.startsWith(pref) && Math.abs(k.length - c.length) <= 2) return v;
    }
  }
  for (const [k, v] of byCode) {
    if (k.length >= 10 && (k.includes(c) || c.includes(k))) return v;
  }
  return null;
}

function resolveSrcFile(srcName, srcFilesList) {
  if (srcFilesList.includes(srcName)) return srcName;
  const stem = srcName.replace(/_\d+\.\w+$/i, "");
  const hit = srcFilesList.find((f) => f.replace(/_\d+\.\w+$/i, "") === stem);
  if (hit) return hit;
  const slug = stem.replace(/^images[\\/]/, "");
  const partial = srcFilesList.filter(
    (f) => f.includes(slug.slice(0, Math.min(18, slug.length))) || slug.includes(f.replace(/_\d+\.\w+$/i, "").slice(0, 18))
  );
  if (partial.length === 1) return partial[0];
  return null;
}

function ensureZipExtracted() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.error("[import-ozti] ZIP bulunamadı:", ZIP_PATH);
    process.exit(1);
  }
  if (!fs.existsSync(JSON_PATH)) {
    fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
    console.log("[import-ozti] ZIP açılıyor…");
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${ZIP_PATH.replace(/'/g, "''")}' -DestinationPath '${TMP.replace(/'/g, "''")}' -Force"`,
      { stdio: "inherit" }
    );
  }
  if (!fs.existsSync(IMAGES_SRC)) {
    const seven = [
      "C:\\Program Files\\7-Zip\\7z.exe",
      "C:\\Program Files (x86)\\7-Zip\\7z.exe",
    ].find((p) => fs.existsSync(p));
    if (!seven) {
      console.error("[import-ozti] 7-Zip gerekli (images.7z için).");
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(IMAGES_SRC), { recursive: true });
    console.log("[import-ozti] images.7z açılıyor…");
    execSync(`"${seven}" x "${ARCHIVE_7Z}" -o"${path.join(TMP, "images-extracted")}" -y`, {
      stdio: "inherit",
    });
  }
}

function buildZipIndexes(zipProducts) {
  const byCode = new Map();
  const byModel = new Map();
  const byNameSlug = new Map();
  const byImgBase = new Map();

  for (const p of zipProducts) {
    const code = normCode(p["ürün_kodu"]);
    if (code) byCode.set(code, p);
    const model = normCode(p["model_numarası"]);
    if (model && model.length >= 4) byModel.set(model, p);
    const slug = slugifyEq(p["ürün_adı"]);
    if (slug) byNameSlug.set(slug, p);
    for (const r of p.resimler || []) {
      const base = basename(r);
      if (base) byImgBase.set(base, p);
    }
  }
  return { byCode, byModel, byNameSlug, byImgBase };
}

function findZipProduct(siteRow, indexes) {
  const text = `${siteRow.name || ""} ${siteRow.specs || ""}`;
  const codes = extractCodes(text);

  for (const c of codes) {
    const byCode = lookupByCode(c, indexes.byCode);
    if (byCode) {
      return {
        zip: byCode,
        method: indexes.byCode.has(c) ? "ürün_kodu" : "ürün_kodu-fuzzy",
      };
    }
    if (indexes.byModel.has(c)) return { zip: indexes.byModel.get(c), method: "model" };
  }

  const nameSlug = slugifyEq(
    String(siteRow.name || "").replace(/öztiryakiler\s*(endüstriyel\s*mutfak)?/gi, "")
  );
  if (nameSlug && indexes.byNameSlug.has(nameSlug)) {
    return { zip: indexes.byNameSlug.get(nameSlug), method: "ad-slug" };
  }

  for (const [slug, v] of indexes.byNameSlug) {
    if (slug.length > 12 && (nameSlug.includes(slug) || slug.includes(nameSlug))) {
      return { zip: v, method: "ad-slug-partial" };
    }
  }

  return null;
}

function copyImage(srcFile, destFile) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.copyFileSync(srcFile, destFile);
  if (fs.existsSync(DIST_IMAGES)) {
    const distDest = path.join(DIST_IMAGES, path.basename(destFile));
    fs.mkdirSync(path.dirname(distDest), { recursive: true });
    fs.copyFileSync(srcFile, distDest);
  }
}

function main() {
  ensureZipExtracted();

  const zipProducts = JSON.parse(fs.readFileSync(JSON_PATH, "utf8")).filter((p) =>
    OZTI_BRAND_RE.test(p["ürün_markası"] || "")
  );
  const indexes = buildZipIndexes(zipProducts);

  const srcFilesList = fs.readdirSync(IMAGES_SRC);
  const site = JSON.parse(fs.readFileSync(SITE_JSON, "utf8"));
  const oztiRows = site
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row }) =>
        OZTI_BRAND_RE.test(row.brand || "") &&
        OZTI_BRAND_RE.test(row.name || "") &&
        !/^kalerm\b/i.test(row.name || "")
    );

  fs.mkdirSync(OUT_IMAGES, { recursive: true });

  const report = {
    at: new Date().toISOString(),
    zip: ZIP_PATH,
    zipProducts: zipProducts.length,
    siteOzti: oztiRows.length,
    copied: 0,
    skippedNoMatch: [],
    skippedNoFile: [],
    matched: [],
  };

  for (const { row, index } of oztiRows) {
    const hit = findZipProduct(row, indexes);
    if (!hit) {
      report.skippedNoMatch.push({ index, name: row.name });
      continue;
    }

    const zipImgs = (hit.zip.resimler || []).map((r) => basename(r)).filter(Boolean);
    const siteImgs = (row.images || []).map((r) => basename(r)).filter(Boolean);
    if (!zipImgs.length || !siteImgs.length) {
      report.skippedNoFile.push({ index, name: row.name, reason: "no-images-array" });
      continue;
    }

    let copiedForProduct = 0;
    const n = Math.min(zipImgs.length, siteImgs.length);
    for (let i = 0; i < n; i++) {
      const srcName = zipImgs[i];
      const destName = siteImgs[i];
      const resolved = resolveSrcFile(srcName, srcFilesList);
      if (!resolved) {
        report.skippedNoFile.push({
          index,
          name: row.name,
          src: srcName,
          dest: destName,
        });
        continue;
      }
      copyImage(path.join(IMAGES_SRC, resolved), path.join(OUT_IMAGES, destName));
      copiedForProduct++;
      report.copied++;
    }

    if (copiedForProduct > 0) {
      report.matched.push({
        index,
        name: row.name,
        method: hit.method,
        zipCode: hit.zip["ürün_kodu"],
        zipName: hit.zip["ürün_adı"],
        images: n,
      });
    }
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
  console.log("\n[import-ozti] Özet:");
  console.log("  Eşleşen ürün:", report.matched.length, "/", oztiRows.length);
  console.log("  Kopyalanan görsel:", report.copied);
  console.log("  Eşleşmeyen:", report.skippedNoMatch.length);
  console.log("  Eksik dosya:", report.skippedNoFile.length);
  console.log("  Rapor:", REPORT);
}

main();
