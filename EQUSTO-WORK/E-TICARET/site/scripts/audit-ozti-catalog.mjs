#!/usr/bin/env node
/**
 * Öztiryakiler katalog denetimi (stub, boş görsel, yanlış dept).
 *   node scripts/audit-ozti-catalog.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOztiBrand,
  isOztiIcecekBeverageDispenser,
  isOztiCihazaltiDolap,
  isOztiSogukHazirlikUnitesi,
  isOztiSebzeDograma,
  isOztiIcecekMilkBar,
  mapOztiDept,
  normKod,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const ESLESME = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const BAD_BYTES = 10995;
const BAD_MD5 = "6696b6d14fecffc05fb1dc0156c9f6b4";

const eslesmeByKod = new Map();
if (fs.existsSync(ESLESME)) {
  const raw = fs.readFileSync(ESLESME, "utf8").replace(/\bNaN\b/g, "null");
  for (const row of JSON.parse(raw)) {
    eslesmeByKod.set(normKod(row.urun_kodu), row);
  }
}

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}
function publicAbs(rel) {
  return path.join(ROOT, "public", String(rel || "").replace(/^\//, "").replace(/\\/g, "/"));
}
function isStubAbs(abs) {
  if (!fs.existsSync(abs)) return false;
  const b = fs.readFileSync(abs);
  return b.length === BAD_BYTES && md5(b) === BAD_MD5;
}

const issues = {
  stubImages: [],
  missingImages: [],
  deptMismatch: [],
  beverageInSogutma: [],
  milkBarInSogutma: [],
  pzcNotSogutma: [],
  cihazaltiNotDolap: [],
  ntvInSogutma: [],
  sebzeNotHazirlik: [],
};

for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
  const dept = file.replace(/\.json$/, "");
  const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
  for (const row of rows) {
    if (!isOztiBrand(row)) continue;
    const sku = row.sku || row.model || "";
    const src = eslesmeByKod.get(normKod(sku)) || {
      urun_kodu: sku,
      urun_tanimi: row.name,
      kategori: row.category,
      kategori_yolu: [],
    };
    const img = (row.images || [])[0];
    if (!img) issues.missingImages.push({ dept, sku });
    else if (isStubAbs(publicAbs(img))) issues.stubImages.push({ dept, sku, img });

    const expected = mapOztiDept(src, []);
    if (expected !== dept && dept !== "set-ustu-mutfak") {
      issues.deptMismatch.push({ dept, expected, sku, kat: src.kategori });
    }
    if (dept === "sogutma" && isOztiIcecekBeverageDispenser(src)) {
      issues.beverageInSogutma.push({ sku });
    }
    if (dept === "sogutma" && isOztiIcecekMilkBar(src)) {
      issues.milkBarInSogutma.push({ sku });
    }
    if (dept === "sogutma" && isOztiCihazaltiDolap(src)) {
      issues.ntvInSogutma.push({ sku });
    }
    if (isOztiSogukHazirlikUnitesi(src) && dept !== "sogutma") {
      issues.pzcNotSogutma.push({ dept, sku });
    }
    if (isOztiCihazaltiDolap(src) && dept !== "dolap") {
      issues.cihazaltiNotDolap.push({ dept, sku });
    }
    if (isOztiSebzeDograma(src) && dept !== "hazirlik") {
      issues.sebzeNotHazirlik.push({ dept, sku });
    }
  }
}

const fail =
  issues.stubImages.length +
  issues.deptMismatch.length +
  issues.beverageInSogutma.length +
  issues.milkBarInSogutma.length +
  issues.pzcNotSogutma.length +
  issues.cihazaltiNotDolap.length +
  issues.ntvInSogutma.length;

console.log("audit-ozti-catalog", {
  stubImages: issues.stubImages.length,
  missingImages: issues.missingImages.length,
  deptMismatch: issues.deptMismatch.length,
  beverageInSogutma: issues.beverageInSogutma.length,
  pzcNotSogutma: issues.pzcNotSogutma.length,
  ntvInSogutma: issues.ntvInSogutma.length,
  sebzeNotHazirlik: issues.sebzeNotHazirlik.length,
});

if (fail) process.exit(1);
