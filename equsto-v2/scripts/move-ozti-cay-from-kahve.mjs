/**
 * kahve.json içindeki çay makinası/kazanı → icecek.json (deploy öncesi hızlı düzeltme).
 *   node scripts/move-ozti-cay-from-kahve.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOztiBrand,
  isOztiCayEquipment,
  mapOztiIcecekCategory,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const KAHVE = path.join(ROOT, "public/data/dept/kahve.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");

function main() {
  const kahve = JSON.parse(fs.readFileSync(KAHVE, "utf8"));
  const icecek = JSON.parse(fs.readFileSync(ICECEK, "utf8"));
  const move = [];
  const keep = [];

  for (const row of kahve) {
    if (isOztiBrand(row) && isOztiCayEquipment(row)) {
      const kod = row.urun_kodu || row.sku || row.model;
      row.dept = "icecek";
      row.category = mapOztiIcecekCategory(row.name, kod);
      move.push(row);
    } else {
      keep.push(row);
    }
  }

  const icecekIds = new Set(icecek.map((r) => r.id || r.sku));
  let added = 0;
  for (const row of move) {
    if (icecekIds.has(row.id)) continue;
    icecek.push(row);
    icecekIds.add(row.id);
    added++;
  }

  fs.writeFileSync(KAHVE, JSON.stringify(keep), "utf8");
  fs.writeFileSync(ICECEK, JSON.stringify(icecek), "utf8");
  console.log("[move-cay] kahve kalan:", keep.length, "| taşınan:", move.length, "| icecek +", added);
}

main();
