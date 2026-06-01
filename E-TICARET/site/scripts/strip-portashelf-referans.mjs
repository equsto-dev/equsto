/**
 * Referans JSON — (PORTASHELF) etiketini kaldır (marka teklifte Equsto).
 *   node scripts/strip-portashelf-referans.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  path.join(siteDir, "public/data/pfos-referans"),
  path.join(siteDir, "public/data"),
];

const SKIP_FILES = new Set([
  "pfos-archive-extract.json",
  "ekipmanlar.json",
  "homepage-vitrin.json",
]);

let files = 0;
let fields = 0;

function strip(s) {
  if (!s || typeof s !== "string") return s;
  let next = s
    .replace(/\s*\(\s*PORTASHELF\s*\)\s*/gi, " ")
    .replace(/,?\s*PORTASHELF\s*,?/gi, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^,\s*|,\s*$/g, "");
  return next === s ? s : next;
}

for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    if (SKIP_FILES.has(name)) continue;
    if (dir.endsWith("/data") && !name.startsWith("pfos-referans") && !name.includes("referans")) {
      continue;
    }
    const file = path.join(dir, name);
    const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    let touched = false;
    for (const k of data.kalemler ?? []) {
      for (const key of ["ad", "bolumAd"]) {
        if (!k[key]) continue;
        const next = strip(k[key]);
        if (next !== k[key]) {
          k[key] = next;
          fields++;
          touched = true;
        }
      }
    }
    if (touched) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
      files++;
      console.log("[strip]", name);
    }
  }
}

console.log(`\n[strip-portashelf] ${files} file(s), ${fields} field(s)`);
