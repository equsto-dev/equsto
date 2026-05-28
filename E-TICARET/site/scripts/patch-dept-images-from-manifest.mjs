/**
 * dept/*.json satırlarına katalog manifest görsellerini yazar.
 *   node scripts/patch-dept-images-from-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oztiVitrinImageHref } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OZTI_MAN = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const AT_MAN = path.join(ROOT, "public/images/catalog/atalay/_extract-manifest.json");
const COVERS = path.join(ROOT, "public/data/category-covers.json");

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function loadMap(file, stripLeading) {
  if (!fs.existsSync(file)) return new Map();
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const m = new Map();
  for (const [k, v] of Object.entries(raw)) {
    const rel = String(v).replace(/^\//, "");
    m.set(normKod(k), rel);
  }
  return m;
}

function isOzti(row) {
  return /öztiryaki|oztiryaki/i.test(String(row.brand || ""));
}

function isAtalay(row) {
  return /atalay/i.test(String(row.brand || ""));
}

function loadDeptFallbacks() {
  if (!fs.existsSync(COVERS)) return {};
  const { byDept } = JSON.parse(fs.readFileSync(COVERS, "utf8"));
  const out = {};
  for (const [dept, url] of Object.entries(byDept || {})) {
    out[dept] = String(url).replace(/^\//, "");
  }
  return out;
}

function main() {
  const ozti = loadMap(OZTI_MAN);
  const atalay = loadMap(AT_MAN);
  const deptFallback = loadDeptFallbacks();
  let total = 0;
  let fallbackN = 0;

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    const fp = path.join(DEPT_DIR, file);
    const dept = file.replace(/\.json$/, "");
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = 0;
    const fallback = deptFallback[dept] || "";

    for (const row of rows) {
      let rel = "";
      if (isOzti(row)) {
        const kod = normKod(row.urun_kodu || row.sku || row.model);
        rel = oztiVitrinImageHref(kod, ozti.get(kod) || "");
      } else if (isAtalay(row)) {
        const model = String(row.model || row.sku || "").trim();
        const hit = atalay.get(model);
        rel = hit ? hit.replace(/^\//, "") : "";
      }
      if (!rel) continue;
      const next = [rel];
      if (JSON.stringify(row.images || []) !== JSON.stringify(next)) {
        row.images = next;
        changed++;
      }
    }

    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      console.log(`  ${file}: ${changed} görsel`);
      total += changed;
    }
  }

  console.log("[patch-dept-images] toplam güncellenen:", total, "kapak yedek:", fallbackN);
}

main();
