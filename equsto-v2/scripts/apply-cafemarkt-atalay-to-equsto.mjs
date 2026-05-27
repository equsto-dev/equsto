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

/** PDF "AEI - 673 / ND CR" → Cafemarkt "AEI-673-ND" */
function pdfGrillAliases(model) {
  const m = String(model || "").trim();
  const out = [];
  const slash = m.match(/^(AEI|AGI)\s*-\s*(\d+)\s*\/\s*(ND|N|D)(?:\s*(CR))?$/i);
  if (slash) {
    const p = slash[1].toUpperCase();
    const sz = slash[2];
    const plate = slash[3].toUpperCase();
    if (plate === "ND") out.push(`${p}-${sz}-ND`, `${p}${sz}ND`);
    else if (plate === "N") {
      out.push(`${p}-${sz}-N`);
      if (slash[4]) out.push(`${p}-${sz}-N-CR`, `${p}${sz}NCR`);
      else out.push(`${p}${sz}N`);
    } else {
      out.push(`${p}-${sz}`);
      if (slash[4]) out.push(`${p}-${sz}-CR`);
    }
  }
  const hyphenGrill = m.match(/^(AEI|AGI)[-\s]*(\d+)\s*\/\s*(N|ND|D)(?:\s*(CR))?$/i);
  if (hyphenGrill) {
    const p = hyphenGrill[1].toUpperCase();
    const sz = hyphenGrill[2];
    const plate = hyphenGrill[3].toUpperCase();
    out.push(`${p}-${sz}`);
    if (plate === "N") out.push(`${p}-${sz}-N`);
    if (plate === "ND") out.push(`${p}-${sz}-ND`);
    if (hyphenGrill[4]) out.push(`${p}-${sz}-CR`, `${p}-${sz}-N-CR`);
  }
  return out;
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
  for (const a of pdfGrillAliases(m)) add(a);
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
  const preferPrefix = String(model || "")
    .trim()
    .match(/^(AEI|AGI)/i)?.[1]
    ?.toUpperCase();
  for (const cand of aliasModels(model)) {
    const needles = modelNeedles(cand);
    if (!needles.length) continue;
    for (const needle of needles) {
      let hits = cmRows.filter((c) => c.hay.includes(needle));
      if (!hits.length) continue;
      if (preferPrefix) {
        const pref = hits.filter((c) =>
          norm(c.p["ürün_adı"]).includes(preferPrefix),
        );
        if (pref.length) hits = pref;
      }
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
    if (adrE[2]) add("ADR-C1-5E-Compact GK");
  }
  const adrG = m.match(/^ADR-C1-(\d+)G(-GK)?$/i);
  if (adrG && !["4", "5"].includes(adrG[1])) {
    add(`ADR-C1-5G${adrG[2] || ""}`);
    add(`ADR-C1-4G${adrG[2] || ""}`);
    add(`ADR-C1-5E${adrG[2] || ""}`);
    add(`ADR-C1-4E${adrG[2] || ""}`);
    if (adrG[2]) {
      add("ADR-C15GGK");
      add("ADR-C14GGK");
    } else {
      add("ADR-C15G");
      add("ADR-C14G");
    }
  }

  if (/^GN\s/i.test(m)) {
    add("EAPD-360");
    add("E APD - 360");
    add("E-APD-360");
  }

  if (/^ADSA-\d+$/i.test(m)) add("ADSA-01");

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

  const aio = m.match(/^AIO\s*-\s*(\d+)/i);
  if (aio) {
    add(`AEO-${aio[1]}`);
    add(`AGO-${aio[1]}`);
  }
  const agoT = m.match(/^AGO\s*-\s*(\d+)\s*T/i);
  if (agoT) add(`AGO-${agoT[1]}`);
  if (/^AEO\s*-\s*1270/i.test(m)) add("AEO-1273");

  const ampg = m.match(/^AMPG\s*-\s*(\d+)/i);
  if (ampg) {
    add(`AMP-${ampg[1]}`);
    add(`ASB-${ampg[1]}`);
    add(`EASB-${ampg[1]}`);
  }

  const aatC = m.match(/^AAT\s*-\s*(\d+)\s*C/i);
  if (aatC) {
    add(`ASB-${aatC[1]}`);
    add(`AAT-${aatC[1]}`);
  }
  const aatS = m.match(/^AAT\s*-\s*(\d+)\s*S/i);
  if (aatS) {
    add(`AAT-${aatS[1]}`);
    add(`AAT-${aatS[1]}S`);
  }
  const aatPlain = m.match(/^AAT\s*-\s*(\d+)$/i);
  if (aatPlain) {
    add(`AAT-${aatPlain[1]}`);
    if (aatPlain[1] === "670") add("AAT-470", "AAT-870");
  }

  if (/^ABB-01/i.test(m)) add("ASB-473", "AEI-360");

  if (/^E\s*AAT\s*-\s*360/i.test(m)) {
    add("E-AAT-460");
    add("E-AAT-660");
  }

  if (/^AGKO\s*-\s*473/i.test(m)) {
    add("AWO-473");
    add("AGO-473");
  }

  if (/^AEI[-\s]*670/i.test(m)) add("AEI-670");
  if (/^AEI[-\s]*470/i.test(m)) add("AEI-470");
  if (/^AEI[-\s]*870/i.test(m)) add("AEI-870-N", "AEI-870-CR");

  if (/^ADR-C1-(\d+)E-GK$/i.test(m)) {
    add("ADR-C1-5E-Compact GK");
    add("ADR-C14GGK");
  }

  if (/^AYEK\s*-\s*02/i.test(m)) {
    add("AYEK-01");
    add("AKEK-02");
  }
  if (/^AKEK-02/i.test(m)) add("AKEK-02");

  if (/^AKF\s*-\s*40\s*E/i.test(m)) add("AKF-30E");
  if (/^AKF\s*-\s*40\s*G/i.test(m)) add("AKF-30G");
  if (/^AKA\s*-\s*01/i.test(m)) add("AKF-20E");

  if (/^ABA\s*-\s*15/i.test(m)) add("ABA-10-2-1", "ABA-12-2-1");

  if (/^ADRM/i.test(m)) add("ADR-C15GGK");

  if (/^ADTA/i.test(m)) add("ATAT-30", "ATA-3753-30");

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
