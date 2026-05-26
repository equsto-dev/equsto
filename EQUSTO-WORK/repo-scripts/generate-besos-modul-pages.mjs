/**
 * Her Vitrum modülü için dist/besos/modul/{slug}/index.html üretir.
 * Canlıda .htaccess bar-module.html olmasa bile slug URL'leri çalışır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const cataloguePath = path.join(root, "public", "data", "vitrum-bars-catalogue.json");
const templatePath = path.join(dist, "bar-module.html");

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function moduleSlug(p) {
  if (!p) return "";
  if (p.slug) return String(p.slug).trim();
  const raw = p.code || p.name || (p.page != null ? "modul-p" + p.page : "");
  let slug = stripDiacritics(String(raw))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (p.page != null) slug = slug || "modul-p" + p.page;
  return slug;
}

if (!fs.existsSync(templatePath)) {
  console.error("[besos-modul-pages] Önce build: dist/bar-module.html yok.");
  process.exit(1);
}
if (!fs.existsSync(cataloguePath)) {
  console.error("[besos-modul-pages] Katalog yok:", cataloguePath);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const products = (catalogue && catalogue.products) || [];
const outRoot = path.join(dist, "besos", "modul");
const seen = new Set();
let count = 0;

for (const p of products) {
  const slug = moduleSlug(p);
  if (!slug || seen.has(slug)) continue;
  seen.add(slug);
  const dir = path.join(outRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), template, "utf8");
  count++;
}

console.log("[besos-modul-pages]", count, "sayfa → dist/besos/modul/{slug}/index.html");
