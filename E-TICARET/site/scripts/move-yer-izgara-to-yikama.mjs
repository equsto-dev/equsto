/**
 * Yer ızgaraları (zemin drenaj) pişirme değil — yıkama departmanına taşır.
 *   node scripts/move-yer-izgara-to-yikama.mjs
 * Ardından: npm run catalog:ozti:ekipmanlar && npm run legacy-pdp:build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const YIKAMA = path.join(ROOT, "public/data/dept/yikama.json");

function isYerIzgarasiRow(row) {
  if (!row) return false;
  const cat = String(row.category || "").toLowerCase();
  if (cat === "yer-izgaralari") return true;
  const hay = `${row.name || ""} ${row.category || ""} ${row.sku || ""}`
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /yer[\s\-]*izgara/.test(hay);
}

function main() {
  const pisirmeRows = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
  const yikamaRows = JSON.parse(fs.readFileSync(YIKAMA, "utf8"));
  if (!Array.isArray(pisirmeRows) || !Array.isArray(yikamaRows)) {
    throw new Error("pisirme/yikama JSON dizi olmalı");
  }

  const keep = [];
  const move = [];
  for (const row of pisirmeRows) {
    if (isYerIzgarasiRow(row)) {
      row.dept = "yikama";
      row.category = "yer-izgaralari";
      move.push(row);
    } else {
      keep.push(row);
    }
  }

  const byKey = new Map();
  for (const row of yikamaRows) {
    byKey.set(String(row.id || row.sku || ""), row);
  }

  let added = 0;
  let updated = 0;
  for (const row of move) {
    const key = String(row.id || row.sku || "");
    if (byKey.has(key)) {
      Object.assign(byKey.get(key), row);
      updated += 1;
    } else {
      yikamaRows.push(row);
      byKey.set(key, row);
      added += 1;
    }
  }

  // yikama içinde zaten yanlış dept ile kalan kopyaları düzelt
  for (const row of yikamaRows) {
    if (isYerIzgarasiRow(row)) {
      row.dept = "yikama";
      row.category = "yer-izgaralari";
    }
  }

  fs.writeFileSync(PISIRME, JSON.stringify(keep), "utf8");
  fs.writeFileSync(YIKAMA, JSON.stringify(yikamaRows), "utf8");
  console.log(
    JSON.stringify(
      {
        moved: move.length,
        pisirmeLeft: keep.length,
        yikamaTotal: yikamaRows.length,
        added,
        updated,
      },
      null,
      2,
    ),
  );
}

main();
