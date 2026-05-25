/**
 * Öztiryakiler PDF sayfa kırpımı (p199, p210…) → web/ ax-images yolu.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.join(ROOT, "..");

function pdfToWeb(rel) {
  const t = String(rel || "").replace(/\\/g, "/");
  const m = /^images\/catalog\/ozti\/p\d+\/(ozti-[a-z0-9-]+\.(?:jpe?g|png|webp))$/i.exec(t);
  if (!m) return rel;
  return `images/catalog/ozti/web/${m[1]}`;
}

function updateRows(rows) {
  let n = 0;
  for (const row of rows) {
    const imgs = row.images || [];
    if (!imgs.length) continue;
    const next = pdfToWeb(imgs[0]);
    if (next === imgs[0]) continue;
    row.images = [next];
    n++;
  }
  return n;
}

const targets = [
  path.join(ROOT, "public/data/dept/sogutma.json"),
  path.join(REPO, "veri/public-data/dept/sogutma.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
  path.join(REPO, "veri/public-data/ekipmanlar.json"),
];

for (const fp of targets) {
  if (!fs.existsSync(fp)) continue;
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  const n = updateRows(rows);
  if (n) {
    fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
    console.log("updated", path.relative(REPO, fp), n);
  }
}

const manifestPath = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let mn = 0;
  for (const [kod, rel] of Object.entries(manifest)) {
    const next = pdfToWeb(rel);
    if (next !== rel) {
      manifest[kod] = next;
      mn++;
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("manifest updated", mn);
}
