import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "data", "images");
const cat = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "data", "ekipmanlar.json"), "utf8"));
const missing = [];
for (const p of cat) {
  for (const im of p.images || []) {
    const f = String(im).replace(/\\/g, "/").replace(/^images\//i, "").split("/").pop();
    const dest = path.join(root, f);
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      missing.push({ brand: p.brand, name: p.name?.slice(0, 60), file: f });
    }
  }
}
const uniq = [...new Map(missing.map((m) => [m.file, m])).values()];
console.log("missing unique files:", uniq.length);
console.log(uniq.slice(0, 20));
