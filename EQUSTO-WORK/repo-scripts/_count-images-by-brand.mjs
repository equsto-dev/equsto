import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "data", "images");
const cat = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "ekipmanlar.json"), "utf8"));

function fileExists(rel) {
  const f = String(rel).replace(/\\/g, "/").replace(/^images\//i, "").split("/").pop();
  return fs.existsSync(path.join(root, f));
}

const stats = { ozti: { miss: 0, total: 0 }, other: { miss: 0, total: 0 } };
for (const p of cat) {
  const oz = /ztiryakiler/i.test(p.brand || "");
  const bucket = oz ? stats.ozti : stats.other;
  for (const im of p.images || []) {
    bucket.total++;
    if (!fileExists(im)) bucket.miss++;
  }
}
console.log(JSON.stringify(stats, null, 2));
