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

const CM = "/images/home/pop-cats";
const OZ = "/images/catalog/ozti/web";
const AT = "/images/catalog/atalay/cafemarkt";

const GO_DEFAULTS = {
  pfos: "/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
  besos: "/images/home/hero-bar-cocktailstation.png",
  marketReyon: `${CM}/cm-soguk-teshir-dolaplari.png`,
};

const DEPT_OVERRIDES = {
  icecek: `${CM}/cm-cay-makineleri.png`,
  pisirme: `${CM}/cm-pizza-firinlari.webp`,
  sogutma: `${OZ}/ozti-7919-06nmv-00.jpg`,
  kahve: `${CM}/cm-filtre-kahve-makineleri.jpg`,
  yikama: `${CM}/cm-bulasikhane-ekipmanlari.png`,
  hazirlik: `${CM}/cm-hazirlik-makineleri.png`,
  tezgah: `${CM}/cm-hazirlik-makineleri.png`,
  dolap: `${OZ}/ozti-7919-37ntv-c1.jpg`,
  davlumbaz: `${OZ}/ozti-7885-15155-10.jpg`,
  tasima: `${OZ}/ozti-7912-12070-a0.jpg`,
  araba: `${AT}/atalay-adk-102.jpg`,
  istif: `${OZ}/ozti-7897-12050-04.jpg`,
  "set-ustu-mutfak": `${CM}/cm-hazirlik-makineleri.png`,
  kuvetler: `${CM}/cm-gastronorm-kuvetler.jpg`,
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
