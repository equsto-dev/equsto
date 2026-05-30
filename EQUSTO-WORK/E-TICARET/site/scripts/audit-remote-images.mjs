/**
 * Harici (http/https) görsel referanslarını raporlar.
 *
 * Kullanım:
 *   node scripts/audit-remote-images.mjs
 *
 * Çıktı:
 * - dept JSON'larında images[] içinde http/https olanları listeler
 * - product-category-covers / homepage gibi JSON'larda harici URL var mı bakar
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function isRemote(s) {
  return typeof s === "string" && /^https?:\/\//i.test(s.trim());
}

function auditDept(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (!/\.json$/i.test(name)) continue;
    const p = path.join(dir, name);
    const list = readJson(p);
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      const imgs = row && Array.isArray(row.images) ? row.images : [];
      for (const u of imgs) {
        if (isRemote(u)) {
          out.push({
            file: `public/data/dept/${name}`,
            name: row.name || row.n || "",
            brand: row.brand || row.b || "",
            image: u,
          });
          break;
        }
      }
    }
  }
  return out;
}

function auditGeneric(jsonRelPaths) {
  const hits = [];
  for (const rel of jsonRelPaths) {
    const p = path.join(PUBLIC, rel);
    const j = readJson(p);
    if (!j) continue;
    const stack = [{ v: j, k: rel }];
    while (stack.length) {
      const { v, k } = stack.pop();
      if (typeof v === "string") {
        if (isRemote(v)) hits.push({ file: `public/${rel}`, key: k, value: v });
        continue;
      }
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) stack.push({ v: v[i], k: `${k}[${i}]` });
        continue;
      }
      if (v && typeof v === "object") {
        for (const kk of Object.keys(v)) stack.push({ v: v[kk], k: `${k}.${kk}` });
      }
    }
  }
  return hits;
}

const deptHits = auditDept(path.join(PUBLIC, "data", "dept"));
console.log("=== Dept JSON remote images (http/https) ===");
if (!deptHits.length) {
  console.log("YOK");
} else {
  console.log("Toplam:", deptHits.length);
  deptHits.slice(0, 60).forEach((h) => {
    console.log("-", h.file, "|", (h.brand || "").slice(0, 24), "|", (h.name || "").slice(0, 60));
    console.log("  ", h.image);
  });
  if (deptHits.length > 60) console.log("... (devamı kırpıldı)");
}

const generic = auditGeneric([
  "data/category-covers.json",
  "data/homepage-vitrin.json",
  "data/vitrin-image-map.json",
]);
console.log("\n=== Other JSON remote URLs ===");
if (!generic.length) {
  console.log("YOK");
} else {
  console.log("Toplam:", generic.length);
  generic.slice(0, 80).forEach((h) => {
    console.log("-", h.file, "|", h.key);
    console.log("  ", h.value);
  });
  if (generic.length > 80) console.log("... (devamı kırpıldı)");
}

process.exit(deptHits.length || generic.length ? 2 : 0);

