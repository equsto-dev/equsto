#!/usr/bin/env node
/**
 * Cafemarkt Atalay görsellerini equsto katalog ürünlerine bağla.
 *
 *   node scripts/apply-cafemarkt-atalay-to-equsto.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-atalay.json");
const CM_IMG_SRC =
  "C:/Users/User/OneDrive/Masaüstü/SİTELER/cafemarkt görseller/images-atalay";

const TARGETS = [
  path.join(ROOT, "public"),
  "C:/D Disk/EQUSTO-CURSOR/equsto-v2/public",
].filter((p, i, arr) => fs.existsSync(p) && arr.indexOf(p) === i);

const DEST_SUB = "images/catalog/atalay/cafemarkt";
const MANIFEST_NAME = "_extract-manifest.json";

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** PDF modeli "ATM 2745/2" → Cafemarkt "ATM-2745-2" vb. */
function modelNeedles(model) {
  const m = String(model || "").trim();
  if (!m) return [];
  const out = new Set();
  const add = (s) => {
    const n = norm(s);
    if (n.length >= 3) out.add(n);
  };
  add(m);
  add(m.replace(/\s+/g, ""));
  add(m.replace(/\s*-\s*/g, "-"));
  add(m.replace(/\//g, "-"));
  add(m.replace(/\s+/g, "-"));
  if (/^E\s+/i.test(m)) add(m.replace(/^E\s+/i, ""));
  return [...out].sort((a, b) => b.length - a.length);
}

function cmHaystack(p) {
  return norm(
    (p["ürün_adı"] || "") +
      (p.açıklamalar || "") +
      (p.açıklamalar_site || ""),
  );
}

function slugFromModel(model) {
  const s =
    "atalay-" +
    String(model || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\+/g, "-plus-");
  return s.replace(/[^a-z0-9-+]/g, "");
}

function findCafemarkt(model, cmRows) {
  for (const cand of aliasModels(model)) {
    const needles = modelNeedles(cand);
    if (!needles.length) continue;
    for (const needle of needles) {
      const hits = cmRows.filter((c) => c.hay.includes(needle));
      if (!hits.length) continue;
      hits.sort((a, b) => a.hay.length - b.hay.length);
      return hits[0].p;
    }
  }
  return null;
}

/** Cafemarkt'te birebir yoksa aynı seriden en yakın modeli dene. */
function aliasModels(model) {
  const m = String(model || "").trim();
  const out = [m];
  const add = (s) => {
    const t = String(s || "").trim();
    if (t && !out.includes(t)) out.push(t);
  };

  const adrE = m.match(/^ADR-C1-(\d+)E(-GK)?$/i);
  if (adrE && !["4", "5"].includes(adrE[1])) {
    add(`ADR-C1-5E${adrE[2] || ""}`);
    add(`ADR-C1-4E${adrE[2] || ""}`);
  }
  const adrG = m.match(/^ADR-C1-(\d+)G(-GK)?$/i);
  if (adrG && !["4", "5"].includes(adrG[1])) {
    add(`ADR-C1-5G${adrG[2] || ""}`);
    add(`ADR-C1-4G${adrG[2] || ""}`);
    add(`ADR-C1-5E${adrG[2] || ""}`);
    add(`ADR-C1-4E${adrG[2] || ""}`);
  }

  const east = m.match(/^E\s*AST\s*-\s*(\d+)/i);
  if (east) {
    const w = Number(east[1]);
    if (w <= 46) add("E-AST-46");
    else if (w <= 86) add("E-AST-86");
    else {
      add("E-AST-86");
      add("E-AST-46");
    }
  }

  const apfm = m.match(/^APFM\s*-?\s*(\d+)/i);
  if (apfm) {
    const n = apfm[1];
    add(`APF-${n}-1`);
    add(`APF-${n}-2`);
  }

  return out;
}

function firstImageFile(product) {
  const r = (product.resimler || [])[0];
  if (!r) return "";
  return String(r).replace(/\\/g, "/").replace(/^images\//i, "").trim();
}

function isAtalayRow(row) {
  return /atalay/i.test(String(row.brand || ""));
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

    const manifestPath = path.join(publicRoot, "images/catalog/atalay", MANIFEST_NAME);
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
        if (!isAtalayRow(row)) continue;
        const model = String(row.model || "").trim();
        const cmHit = findCafemarkt(model, cmRows);
        if (!cmHit) {
          stats.noCm++;
          continue;
        }
        const needles = aliasModels(model).flatMap((c) => modelNeedles(c));
        const hits = cmRows.filter((c) =>
          needles.some((n) => c.hay.includes(n)),
        );
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

        const slug = slugFromModel(model) + path.extname(srcName).toLowerCase();
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
        if (model) manifest[model] = `/${rel.replace(/\\/g, "/")}`;
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
console.log("\n[cafemarkt→equsto]", stats);
