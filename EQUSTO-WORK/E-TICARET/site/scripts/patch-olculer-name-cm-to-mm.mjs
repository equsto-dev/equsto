/**
 * Ürün adındaki 100*110*85 gibi cm kısaltmaları yanlışlıkla mm olarak kaydedilmiş olculer alanlarını düzeltir.
 *   node scripts/patch-olculer-name-cm-to-mm.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  path.join(ROOT, "public/data/dept/pisirme.json"),
  path.join(ROOT, "public/data/dept/sogutma.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/pisirme.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/sogutma.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/ekipmanlar.json"),
];

function nameTrip(name) {
  const m = String(name || "").match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function dimLabel(g, d, y) {
  return `${g}×${d}×${y} mm`;
}

function patchRow(row) {
  const trip = nameTrip(row.name);
  if (!trip) return false;
  const o = row.olculer;
  if (!o) return false;
  const g = Number(o.genislik_mm);
  const d = Number(o.derinlik_mm);
  const y = Number(o.yukseklik_mm);
  if (!g || !d || !y) return false;
  if (g !== trip[0] || d !== trip[1] || y !== trip[2]) return false;
  if (Math.max(g, d, y) > 500) return false;

  const mm = { genislik_mm: g * 10, derinlik_mm: d * 10, yukseklik_mm: y * 10 };
  row.olculer = { ...o, ...mm };
  const line = `En×Boy×Yükseklik: ${dimLabel(mm.genislik_mm, mm.derinlik_mm, mm.yukseklik_mm)}`;
  if (!Array.isArray(row.teknik_ozellikler)) row.teknik_ozellikler = [];
  row.teknik_ozellikler = row.teknik_ozellikler.filter((t) => !/^En×Boy×Yükseklik:/i.test(String(t)));
  row.teknik_ozellikler.unshift(line);

  const kw = new Set(Array.isArray(row.keywords) ? row.keywords : []);
  kw.delete(dimLabel(g, d, y));
  kw.add(dimLabel(mm.genislik_mm, mm.derinlik_mm, mm.yukseklik_mm));
  row.keywords = [...kw];

  if (Array.isArray(row.images)) {
    row.images = row.images.map((img) => {
      const s = String(img || "").replace(/\\/g, "/");
      const m = /^images\/catalog\/ozti\/p\d+\/(ozti-[a-z0-9-]+\.(?:jpe?g|png|webp))$/i.exec(s);
      return m ? `images/catalog/ozti/web/${m[1]}` : img;
    });
    row.images = [...new Set(row.images)];
  }

  return true;
}

function patchFile(fp) {
  if (!fs.existsSync(fp)) {
    console.log("[skip]", fp);
    return 0;
  }
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const row of rows) {
    if (patchRow(row)) n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
  console.log("[ok]", fp, n);
  return n;
}

let total = 0;
for (const f of TARGETS) total += patchFile(f);
console.log("[patch-olculer-name-cm-to-mm] toplam:", total);
