#!/usr/bin/env node
/**
 * AVATHERM satırlarını araba/servis dept'ten tasima'ya taşır.
 *   node scripts/establish-avatherm-tasima.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { applyAvathermTasimaMeta, isAvathermRow } from "./lib/avatherm-tasima.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(DEPT, name), "utf8"));
}

function save(name, rows) {
  fs.writeFileSync(path.join(DEPT, name), JSON.stringify(rows), "utf8");
}

const araba = load("araba.json");
const servis = load("servis.json");
const tasima = load("tasima.json");

const tasimaIds = new Set(tasima.map((r) => r.id).filter(Boolean));
const moved = [];

function pull(rows, file) {
  const keep = [];
  for (const row of rows) {
    if (!isAvathermRow(row)) {
      keep.push(row);
      continue;
    }
    if (tasimaIds.has(row.id)) continue;
    applyAvathermTasimaMeta(row);
    tasima.push(row);
    tasimaIds.add(row.id);
    moved.push({ from: file, sku: row.sku, name: row.name });
  }
  return keep;
}

const arabaNext = pull(araba, "araba");
const servisNext = pull(servis, "servis");

for (const row of tasima) {
  if (isAvathermRow(row)) applyAvathermTasimaMeta(row);
}

save("araba.json", arabaNext);
save("servis.json", servisNext);
save("tasima.json", tasima);

const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});
if (rebuild.status !== 0) process.exit(rebuild.status || 1);

console.log(`[avatherm-tasima] ${moved.length} satır taşındı`);
for (const m of moved) console.log(`  ${m.from} → tasima · ${m.sku} · ${m.name?.slice(0, 55)}`);
