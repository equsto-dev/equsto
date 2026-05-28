import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "geo-bodies-words.json");
const data = JSON.parse(fs.readFileSync(p, "utf8"));

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

const rows = [];
for (const key of Object.keys(data).sort()) {
  const w = wordCount(data[key]);
  rows.push({ key, words: w, ok: w >= 600 && w <= 700 });
}
const words = rows.map((r) => r.words);
console.log("min", Math.min(...words), "max", Math.max(...words));
for (const r of rows) {
  if (!r.ok) console.log("OUT", r.key, r.words);
}
console.log("ok", rows.filter((r) => r.ok).length, "/", rows.length);
