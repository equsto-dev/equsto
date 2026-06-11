import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function existsRel(rel) {
  if (!rel) return false;
  const p = path.join(ROOT, "public", String(rel).replace(/^\//, ""));
  return fs.existsSync(p) && fs.statSync(p).size > 500;
}

function auditDept(file) {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/dept", file), "utf8"));
  const missing = [];
  for (const r of rows) {
    const img = r.images?.[0];
    if (!img || !existsRel(img)) {
      missing.push({
        brand: r.brand,
        name: r.name?.slice(0, 60),
        sku: r.sku || r.model,
        img: img || null,
      });
    }
  }
  return { total: rows.length, missing };
}

for (const dept of ["icecek.json", "hazirlik.json"]) {
  const { total, missing } = auditDept(dept);
  console.log(`\n=== ${dept} === total ${total}, dosya yok ${missing.length}`);
  const ates = missing.filter((m) => /ate[sş]|ats/i.test(m.brand || ""));
  const ozti = missing.filter((m) => /öztiryaki|oztiryaki/i.test(m.brand || ""));
  console.log("  Ates:", ates.length, "Ozti:", ozti.length);
  for (const m of missing.slice(0, 20)) {
    console.log(" ", m.sku, m.name, m.img?.slice(0, 50) || "NO_IMG");
  }
}
