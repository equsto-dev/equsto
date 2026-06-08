#!/usr/bin/env node
/**
 * Öztiryakiler paslanmaz tezgahları /shop/tezgah vitrininden kalıcı kaldırır.
 * Dolap / ara tezgah modülü uygun dept'e taşınır; evye/çalışma hattı vitrin dışı kalır.
 *
 *   node scripts/exclude-ozti-tezgah.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapOztiTezgahExcludedDept, OZTI_BRAND } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function isOztiBrand(brand) {
  return /öztiryak|oztiryak/i.test(String(brand || ""));
}

function rowHay(row) {
  const pathHay = Array.isArray(row.kategori_yolu) ? row.kategori_yolu.join(" ") : "";
  return `${pathHay} ${row.kategori || ""} ${row.name || ""}`.toLocaleUpperCase("tr");
}

function rowKey(row) {
  if (row.id) return String(row.id);
  const sku = row.sku || row.model || "";
  if (sku) return `${row.dept || ""}__${sku}`;
  return `${row.dept || ""}__${row.brand || ""}__${row.name || ""}`;
}

function readDept(name) {
  const p = path.join(DEPT_DIR, `${name}.json`);
  return { p, rows: JSON.parse(fs.readFileSync(p, "utf8")) };
}

function writeDept(p, rows) {
  const tmp = `${p}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_) {}
  fs.renameSync(tmp, p);
}

const { p: tezgahPath, rows: tezgahRows } = readDept("tezgah");
const oztiInTezgah = tezgahRows.filter((r) => isOztiBrand(r.brand));
const keepTezgah = tezgahRows.filter((r) => !isOztiBrand(r.brand));

const stats = { removed: 0, toDolap: 0, toSetUstu: 0, excluded: 0 };
const dolap = readDept("dolap");
const setUstu = readDept("set-ustu-mutfak");
const dolapKeys = new Set(dolap.rows.map(rowKey));
const setUstuKeys = new Set(setUstu.rows.map(rowKey));

for (const row of oztiInTezgah) {
  const target = mapOztiTezgahExcludedDept(rowHay(row));
  if (target === "dolap") {
    const next = { ...row, dept: "dolap", category: row.category || "dolap" };
    const k = rowKey(next);
    if (!dolapKeys.has(k)) {
      dolap.rows.push(next);
      dolapKeys.add(k);
    }
    stats.toDolap++;
  } else if (target === "set-ustu-mutfak") {
    const next = { ...row, dept: "set-ustu-mutfak", category: row.category || "set-ustu-mutfak" };
    const k = rowKey(next);
    if (!setUstuKeys.has(k)) {
      setUstu.rows.push(next);
      setUstuKeys.add(k);
    }
    stats.toSetUstu++;
  } else {
    stats.excluded++;
  }
  stats.removed++;
}

writeDept(tezgahPath, keepTezgah);
writeDept(dolap.p, dolap.rows);
writeDept(setUstu.p, setUstu.rows);

console.log("[exclude-ozti-tezgah] tezgah:", tezgahRows.length, "→", keepTezgah.length);
console.log("[exclude-ozti-tezgah] ozti kaldırıldı:", stats.removed);
console.log("[exclude-ozti-tezgah] → dolap:", stats.toDolap, "| → set-ustu-mutfak:", stats.toSetUstu, "| vitrin dışı:", stats.excluded);
console.log("[exclude-ozti-tezgah] marka:", OZTI_BRAND);
