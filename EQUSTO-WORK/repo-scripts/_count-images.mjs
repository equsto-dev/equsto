import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "data", "images");
const cat = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "ekipmanlar.json"), "utf8"));
const refs = new Set();
for (const p of cat) {
  for (const im of p.images || []) {
    const f = String(im).replace(/\\/g, "/").replace(/^images\//i, "").split("/").pop();
    if (f) refs.add(f);
  }
}
let miss = 0;
let hit = 0;
const missingSample = [];
for (const f of refs) {
  if (fs.existsSync(path.join(root, f))) hit++;
  else {
    miss++;
    if (missingSample.length < 5) missingSample.push(f);
  }
}
const ozti = cat.filter((p) => /ztiryakiler/i.test(p.brand || "") && p.sku);
const km = cat.filter((p) => !p.sku && (p.images || []).length);
console.log(JSON.stringify({ products: cat.length, uniqueImages: refs.size, hit, miss, oztiWithSku: ozti.length, missingSample }, null, 2));
