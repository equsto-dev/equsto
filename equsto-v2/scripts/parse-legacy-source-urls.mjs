import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY = path.join(ROOT, "public/data/ekipmanlar.json.legacy-off");

const text = fs.readFileSync(LEGACY, "utf8");
const out = new Map();
const re =
  /"urun_kodu":"([^"]+)"[\s\S]{0,1200}?"sourceUrl":"(https:\/\/oztiryakiler\.com\.tr\/urun\/[^"]+)"/g;
let m;
while ((m = re.exec(text))) {
  out.set(m[1], m[2]);
}
console.log("mapped", out.size);
console.log([...out.entries()].slice(0, 3));
