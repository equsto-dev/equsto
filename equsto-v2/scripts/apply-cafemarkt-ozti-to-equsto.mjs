#!/usr/bin/env node
/**
 * Cafemarkt Öztiryakiler görsellerini equsto katalog ürünlerine bağla.
 * Eşleştirme: model/sku → cafemarkt açıklama + ürün adı metninde aranır.
 *
 *   node scripts/apply-cafemarkt-ozti-to-equsto.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-ozti.json");
const CM_IMG_SRC =
  "C:/Users/User/OneDrive/Masaüstü/SİTELER/cafemarkt görseller/images-ozti";

const TARGETS = [
  path.join(ROOT, "public"),
  "C:/D Disk/EQUSTO-CURSOR/equsto-v2/public",
].filter((p, i, arr) => fs.existsSync(p) && arr.indexOf(p) === i);

const DEST_SUB = "images/catalog/ozti/cafemarkt";
const MANIFEST_NAME = "_extract-manifest.json";

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function slugFromKod(kod) {
  const s =
    "ozti-" +
    String(kod || "")
      .toLowerCase()
      .replace(/\./g, "-");
  return s.replace(/[^a-z0-9-]/g, "");
}

function cmHaystack(p) {
  return norm(
    (p["ürün_adı"] || "") +
      (p.açıklamalar || "") +
      (p.açıklamalar_site || ""),
  );
}

function findCafemarkt(kod, cmRows) {
  const needle = norm(kod);
  if (!needle || needle.length < 6) return null;
  const hits = cmRows.filter((c) => c.hay.includes(needle));
  if (!hits.length) return null;
  hits.sort((a, b) => a.hay.length - b.hay.length);
  return hits[0].p;
}

function firstImageFile(product) {
  const r = (product.resimler || [])[0];
  if (!r) return "";
  return String(r).replace(/\\/g, "/").replace(/^images\//i, "").trim();
}

function isOztiRow(row) {
  return /öztiryakiler/i.test(String(row.brand || ""));
}

function deptFiles(publicRoot) {
  const dir = path.join(publicRoot, "data/dept");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => path.join(dir, f));
}

function applyToTargets() {
  const cm = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const cmRows = cm.map((p) => ({ p, hay: cmHaystack(p) }));

  const stats = {
    matched: 0,
    copied: 0,
    updated: 0,
    noCm: 0,
    noFile: 0,
    ambiguous: 0,
  };

  for (const publicRoot of TARGETS) {
    const destDir = path.join(publicRoot, DEST_SUB);
    fs.mkdirSync(destDir, { recursive: true });

    const manifestPath = path.join(publicRoot, "images/catalog/ozti", MANIFEST_NAME);
    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      } catch {
        manifest = {};
      }
    }

    const filesToPatch = [
      ...deptFiles(publicRoot),
      path.join(publicRoot, "data/ekipmanlar.json"),
    ].filter((f) => fs.existsSync(f));

    for (const jsonPath of filesToPatch) {
      const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      let changed = 0;

      for (const row of rows) {
        if (!isOztiRow(row)) continue;
        const kod = String(row.model || row.sku || "").trim();
        const cmHit = findCafemarkt(kod, cmRows);
        if (!cmHit) {
          stats.noCm++;
          continue;
        }
        const needle = norm(kod);
        const hits = cmRows.filter((c) => c.hay.includes(needle));
        if (hits.length > 1) stats.ambiguous++;

        stats.matched++;
        const srcName = firstImageFile(cmHit);
        if (!srcName) {
          stats.noFile++;
          continue;
        }
        const srcPath = path.join(CM_IMG_SRC, srcName);
        if (!fs.existsSync(srcPath)) {
          stats.noFile++;
          continue;
        }

        const slug = slugFromKod(kod) + path.extname(srcName).toLowerCase();
        const rel = `${DEST_SUB}/${slug}`;
        const destPath = path.join(publicRoot, rel);

        fs.copyFileSync(srcPath, destPath);
        stats.copied++;

        const relArr = [rel.replace(/\\/g, "/")];
        if (JSON.stringify(row.images) !== JSON.stringify(relArr)) {
          row.images = relArr;
          changed++;
          stats.updated++;
        }
        if (kod) manifest[kod] = `/${rel.replace(/\\/g, "/")}`;
      }

      if (changed) {
        fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
        console.log(`  ${path.basename(jsonPath)}: ${changed} gorsel guncellendi`);
      }
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`  manifest: ${Object.keys(manifest).length} kod (${publicRoot})`);
  }

  return stats;
}

const stats = applyToTargets();
console.log("\n[cafemarkt→equsto ozti]", stats);
