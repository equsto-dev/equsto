import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "geo-bodies-350w.json");
const data = JSON.parse(fs.readFileSync(p, "utf8"));

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

const rows = [];
for (const key of Object.keys(data).sort()) {
  const w = wordCount(data[key]);
  rows.push({ key, words: w, ok: w >= 300 && w <= 350 });
}
const words = rows.map((r) => r.words);
console.log("File:", p);
console.log("min", Math.min(...words), "max", Math.max(...words));
console.log("--- per profile ---");
for (const r of rows) {
  const flag = r.ok ? "OK" : "OUT";
  console.log(`${flag}  ${r.key.padEnd(24)} ${r.words}`);
}
const outOfRange = rows.filter((r) => !r.ok);
if (outOfRange.length) {
  console.log("\nOUT OF RANGE:", outOfRange.map((r) => `${r.key}(${r.words})`).join(", "));
  process.exitCode = 1;
} else {
  console.log("\nAll profiles in 300–350 range.");
}
