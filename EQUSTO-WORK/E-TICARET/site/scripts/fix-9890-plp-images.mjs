#!/usr/bin/env node
/** 9890.* — katalog JSON'da ax web render yerine cafemarkt foto kullan. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/pisirme.json");
const CAFE = "images/catalog/ozti/cafemarkt";
const WEB = "images/catalog/ozti/web";

function slug(k) {
  return (
    "ozti-" +
    String(k)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
let n = 0;
for (const row of rows) {
  if (!/^9890\./i.test(row.sku || "")) continue;
  const cafeRel = `${CAFE}/${slug(row.sku)}.jpg`;
  const cafeAbs = path.join(ROOT, "public", cafeRel);
  if (!fs.existsSync(cafeAbs) || fs.statSync(cafeAbs).size < 8000) continue;
  const cur = String((row.images || [])[0] || "");
  if (cur === cafeRel) continue;
  if (cur.includes("/ozti/web/") || !cur) {
    row.images = [cafeRel];
    row.imageSource = "cafemarkt";
    n++;
  }
}
fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
console.log("[fix-9890-plp-images] updated", n);
