/**
 * Departman / vitrin için kategori kapak görselleri — category-covers.json
 *   node scripts/build-category-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const DEPT_DIR = path.join(PUBLIC, "data", "dept");
const OUT = path.join(PUBLIC, "data", "category-covers.json");

const GO_DEFAULTS = {
  pfos: "/images/pfos/dis-mutfak-gece-render.jpg?v=20260527c",
  besos: "/images/home/hero-bar-cocktailstation.png",
  marketReyon: "/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg",
};

const DEPT_OVERRIDES = {
  icecek: "/images/catalog/ozti/p411/ozti-8224-0st20-00.jpg",
  pisirme: "/images/catalog/atalay/p7/atalay-e-aei---360.jpg",
};

function toWebPath(rel) {
  if (!rel) return "";
  const s = String(rel).replace(/\\/g, "/");
  if (s.startsWith("/images/")) return s;
  if (s.startsWith("images/")) return "/" + s;
  return "";
}

function firstCatalogImage(rows) {
  for (const r of rows) {
    const imgs = r.images || [];
    const hit = imgs.find((u) => /catalog/i.test(String(u)));
    if (hit) return toWebPath(hit);
  }
  return "";
}

function main() {
  const byDept = { ...DEPT_OVERRIDES };
  if (fs.existsSync(DEPT_DIR)) {
    for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
      const dept = file.replace(/\.json$/, "");
      if (byDept[dept]) continue;
      const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
      const img = firstCatalogImage(Array.isArray(rows) ? rows : []);
      if (img) byDept[dept] = img;
    }
  }

  const out = {
    version: "1",
    updated: new Date().toISOString().slice(0, 10),
    byDept,
    byGo: GO_DEFAULTS,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("[category-covers]", Object.keys(byDept).length, "dept,", Object.keys(GO_DEFAULTS).length, "go →", OUT);
}

main();
