import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const P287 = path.join(ROOT, "public/images/catalog/ozti/p287");
const p287 = new Set();
if (fs.existsSync(P287)) {
  for (const n of fs.readdirSync(P287)) {
    if (n.endsWith(".jpg")) {
      p287.add(crypto.createHash("md5").update(fs.readFileSync(path.join(P287, n))).digest("hex"));
    }
  }
}

function classifyAbs(abs) {
  if (!fs.existsSync(abs)) return "missing";
  if (p287.has(crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex"))) return "catalog";
  const bytes = fs.statSync(abs).size;
  if (bytes < 95000) return "catalog";
  if (bytes > 215000) return "render";
  return "wire";
}

const depts = fs.readdirSync(path.join(ROOT, "public/data/dept")).filter((f) => f.endsWith(".json"));
const stats = { render: 0, wire: 0, catalog: 0, missing: 0, ozti: 0 };
const bad = [];
for (const f of depts) {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/dept", f), "utf8"));
  for (const r of rows) {
    if (!/öztiryakiler/i.test(r.brand || "")) continue;
    stats.ozti++;
    const rel = (r.images || [])[0];
    const k = rel ? classifyAbs(path.join(ROOT, "public", rel.replace(/^\//, ""))) : "missing";
    stats[k] = (stats[k] || 0) + 1;
    if (k !== "render") bad.push({ dept: f.replace(".json", ""), sku: r.sku || r.model, k });
  }
}
console.log(JSON.stringify({ stats, needCafemarkt: bad.length, byDept: bad.reduce((a, x) => { a[x.dept] = (a[x.dept] || 0) + 1; return a; }, {}) }, null, 2));
