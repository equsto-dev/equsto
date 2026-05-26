/**
 * kahve.json → icecek: kahveci demlik (8573.000*) çay/sunum aksesuarıdır.
 *   node scripts/move-kahveci-demlik-from-kahve.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOztiBrand,
  isOztiKahveciDemlik,
  mapOztiIcecekCategory,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  { kahve: path.join(ROOT, "public/data/dept/kahve.json"), icecek: path.join(ROOT, "public/data/dept/icecek.json") },
  {
    kahve: path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/kahve.json"),
    icecek: path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/icecek.json"),
  },
];

function applyPair({ kahve, icecek }) {
  if (!fs.existsSync(kahve) || !fs.existsSync(icecek)) {
    console.log("[skip]", kahve);
    return null;
  }
  const kahveRows = JSON.parse(fs.readFileSync(kahve, "utf8"));
  const icecekRows = JSON.parse(fs.readFileSync(icecek, "utf8"));
  const move = [];
  const keep = [];

  for (const row of kahveRows) {
    if (isOztiBrand(row) && isOztiKahveciDemlik(row)) {
      const kod = row.urun_kodu || row.sku || row.model;
      row.dept = "icecek";
      row.category = mapOztiIcecekCategory(row.name, kod);
      move.push(row);
    } else {
      keep.push(row);
    }
  }

  const icecekIds = new Set(icecekRows.map((r) => r.id || r.sku));
  let added = 0;
  for (const row of move) {
    const idx = icecekRows.findIndex((r) => (r.id || r.sku) === (row.id || row.sku));
    if (idx >= 0) {
      icecekRows[idx] = row;
    } else if (!icecekIds.has(row.id || row.sku)) {
      icecekRows.push(row);
      icecekIds.add(row.id || row.sku);
      added++;
    }
  }

  fs.writeFileSync(kahve, JSON.stringify(keep), "utf8");
  fs.writeFileSync(icecek, JSON.stringify(icecekRows), "utf8");
  return { kahve, keep: keep.length, moved: move.length, added };
}

for (const pair of TARGETS) {
  const r = applyPair(pair);
  if (r) console.log("[move-kahveci-demlik]", r.kahve, "| kahve:", r.keep, "| taşınan:", r.moved, "| icecek +", r.added);
}
