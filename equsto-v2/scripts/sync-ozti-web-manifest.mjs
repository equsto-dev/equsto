/**
 * public/images/catalog/ozti/web/* dosyalarını manifest + dept JSON ile eşle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function slugFile(kod) {
  return (
    "ozti-" +
    String(kod)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function readJsonArray(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\bNaN\b/g, "null");
  return JSON.parse(text);
}

const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : {};
const webFiles = new Set(
  fs.existsSync(WEB) ? fs.readdirSync(WEB).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : []
);

let deptChanged = 0;
for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(DEPT_DIR, file);
  const rows = readJsonArray(fp);
  let n = 0;
  for (const row of rows) {
    if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;
    const kod = normKod(row.urun_kodu || row.sku || row.model);
    if (!kod) continue;
    const base = slugFile(kod);
    const hit = [...webFiles].find(
      (f) => f.startsWith(base + ".") || f === base + ".jpg"
    );
    if (!hit) continue;
    const rel = `images/catalog/ozti/web/${hit}`;
    manifest[kod] = rel;
    if (JSON.stringify(row.images || []) !== JSON.stringify([rel])) {
      row.images = [rel];
      n++;
    }
  }
  if (n) {
    fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
    deptChanged += n;
    console.log(file, n);
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
console.log("[sync-ozti-web] manifest keys:", Object.keys(manifest).length, "dept rows:", deptChanged);
