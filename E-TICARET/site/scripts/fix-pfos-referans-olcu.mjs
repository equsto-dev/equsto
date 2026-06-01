/**
 * Referans JSON — bozuk ölçü/metin (ı / FFFD) → ×; PORTASHELF davlumbaz ölçüsü
 *   node scripts/fix-pfos-referans-olcu.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const refDir = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "public/data/pfos-referans",
);

function fixText(s) {
  if (!s || typeof s !== "string") return s;
  return s
    .replace(/\uFFFD/g, "×")
    .replace(/(\d)\s+ı\s+(\d)/gi, "$1×$2")
    .replace(/(\d)\s+i\s+(\d)/gi, "$1×$2")
    .replace(/S\s+E\s+R\s+V\s+ı\s+S/gi, "SERVIS")
    .replace(/B\s+U\s+L\s+A\s+ı\s+I\s+K/gi, "BULAŞIK")
    .replace(/\s+/g, " ")
    .trim();
}

let files = 0;
let fields = 0;

for (const name of fs.readdirSync(refDir)) {
  if (!name.endsWith(".json")) continue;
  const file = path.join(refDir, name);
  const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  let touched = false;

  for (const k of data.kalemler ?? []) {
    for (const key of ["olcu", "ad", "bolumAd"]) {
      if (!k[key]) continue;
      const next = fixText(k[key]);
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
    console.log("[fix-olcu]", name);
  }
}

console.log(`\n[fix-pfos-referans-olcu] ${files} file(s), ${fields} field(s)`);
