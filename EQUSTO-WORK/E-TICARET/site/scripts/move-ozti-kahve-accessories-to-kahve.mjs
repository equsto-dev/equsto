/**
 * icecek.json → kahve: filtre kahve (8574.FM), kahve süt potu (8534) — demlik (8573.000) icecek’te kalır.
 *   node scripts/move-ozti-kahve-accessories-to-kahve.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isOztiBrand,
  isOztiKahveAccessory,
  mapOztiKahveCategory,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const KAHVE = path.join(ROOT, "public/data/dept/kahve.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");

function main() {
  const kahve = JSON.parse(fs.readFileSync(KAHVE, "utf8"));
  const icecek = JSON.parse(fs.readFileSync(ICECEK, "utf8"));
  const move = [];
  const keep = [];

  for (const row of icecek) {
    if (isOztiBrand(row) && isOztiKahveAccessory(row)) {
      const kod = row.urun_kodu || row.sku || row.model;
      row.dept = "kahve";
      row.category = mapOztiKahveCategory(row.name, kod);
      move.push(row);
    } else {
      keep.push(row);
    }
  }

  const kahveIds = new Set(kahve.map((r) => r.id || r.sku));
  let added = 0;
  for (const row of move) {
    const idx = kahve.findIndex((r) => (r.id || r.sku) === row.id);
    if (idx >= 0) {
      kahve[idx] = row;
    } else if (!kahveIds.has(row.id)) {
      kahve.push(row);
      kahveIds.add(row.id);
      added++;
    }
  }

  fs.writeFileSync(KAHVE, JSON.stringify(kahve), "utf8");
  fs.writeFileSync(ICECEK, JSON.stringify(keep), "utf8");
  console.log("[move-kahve-acc] kahve:", kahve.length, "| icecek:", keep.length, "| taşınan:", move.length, "| yeni +", added);
}

main();
