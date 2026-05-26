/**
 * vitrum-bars-catalogue.json — her ürüne slug ekler (idempotent).
 *   node scripts/sync-vitrum-module-slugs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAT = path.join(ROOT, "public", "data", "vitrum-bars-catalogue.json");

function stripDiacritics(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugFor(p) {
  const raw = p.code || p.name || `modul-p${p.page || 0}`;
  let slug = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug && p.page != null) slug = `modul-p${p.page}`;
  return slug;
}

const data = JSON.parse(fs.readFileSync(CAT, "utf8"));
const used = new Set();
let n = 0;
for (const p of data.products || []) {
  let slug = slugFor(p);
  if (used.has(slug)) slug = `${slug}-p${p.page || n}`;
  used.add(slug);
  if (p.slug !== slug) {
    p.slug = slug;
    n++;
  }
}
fs.writeFileSync(CAT, JSON.stringify(data, null, 2), "utf8");
console.log("[vitrum] slug güncellendi:", n, "/", data.products.length);
