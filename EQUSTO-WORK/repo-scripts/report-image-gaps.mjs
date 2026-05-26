import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const items = JSON.parse(fs.readFileSync(path.join(root, "public/data/ekipmanlar.json"), "utf8"));
const imgDir = path.join(root, "public/data/images");

function filePart(rel) {
  return String(rel)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^data\/images\//i, "")
    .replace(/^images\//i, "");
}

let withImg = 0;
let onDisk = 0;
const missSamples = [];

for (const x of items) {
  const rel = x?.images?.[0];
  if (!rel) continue;
  withImg++;
  const fp = path.join(imgDir, filePart(rel));
  if (fs.existsSync(fp)) onDisk++;
  else if (missSamples.length < 8) missSamples.push({ name: x.name?.slice(0, 50), file: filePart(rel) });
}

console.log("Katalogda gorsel ref:", withImg);
console.log("Diskte var:", onDisk, `(${((100 * onDisk) / withImg).toFixed(1)}%)`);
console.log("Diskte yok:", withImg - onDisk);
console.log("\nOrnek eksik dosyalar:");
for (const s of missSamples) console.log(" -", s.file);
