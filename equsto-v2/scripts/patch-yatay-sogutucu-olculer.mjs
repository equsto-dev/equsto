/**
 * Yatay tip tezgah soğutucular (79E3/79E4) — En×Boy×Yükseklik mm.
 *   node scripts/patch-yatay-sogutucu-olculer.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  path.join(ROOT, "public/data/dept/sogutma.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/sogutma.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/ekipmanlar.json"),
];

/** Öztiryakiler seri kodu (SKU .26/.36 …) → dış ölçüler (mm). */
const SERIES = {
  "26": { genislik_mm: 600, boyKapi: 1314, boyCekmece: 1344, yukseklik_mm: 850 },
  "27": { genislik_mm: 700, boyKapi: 1314, boyCekmece: 1344, yukseklik_mm: 850 },
  "36": { genislik_mm: 600, boy: 1780, yukseklik_mm: 850 },
  "37": { genislik_mm: 700, boy: 1780, yukseklik_mm: 850 },
  "46": { genislik_mm: 600, boy: 2246, yukseklik_mm: 850 },
  "47": { genislik_mm: 700, boy: 2246, yukseklik_mm: 850 },
};

function dimsForRow(row) {
  const sku = String(row.sku || row.urun_kodu || row.model || "").trim();
  const m = sku.match(/^79E[34]\.(\d{2})/i);
  if (!m) return null;
  const s = SERIES[m[1]];
  if (!s) return null;
  const name = String(row.name || "");
  const boy =
    s.boy ??
    (/\d+\s*CEKMECE/i.test(name) ? s.boyCekmece : s.boyKapi);
  return {
    genislik_mm: s.genislik_mm,
    derinlik_mm: boy,
    yukseklik_mm: s.yukseklik_mm,
  };
}

function dimLabel(o) {
  return `${o.genislik_mm}×${o.derinlik_mm}×${o.yukseklik_mm} mm`;
}

function patchRow(row) {
  if (!/YATAY TIP/i.test(String(row.name || ""))) return false;
  const o = dimsForRow(row);
  if (!o) return false;

  row.olculer = { ...o };
  const line = `En×Boy×Yükseklik: ${dimLabel(o)}`;
  if (!Array.isArray(row.teknik_ozellikler)) row.teknik_ozellikler = [];
  const rest = row.teknik_ozellikler.filter((t) => !/^En×Boy×Yükseklik:/i.test(String(t)));
  row.teknik_ozellikler = [line, ...rest];

  const kod = String(row.sku || row.urun_kodu || "").trim();
  const block = `${line}\nÜrün kodu: ${kod}`;
  if (row.specs && !row.specs.includes("En×Boy×Yükseklik")) {
    row.specs = row.specs.replace(/^[\s\S]*?(?=Ürün kodu:|Liste fiyatı)/i, "") || row.specs;
    row.specs = `${String(row.name || "").trim()}\n\n${block}\n\n${String(row.specs || "").trim()}`.trim();
  }

  const kw = new Set(Array.isArray(row.keywords) ? row.keywords : []);
  kw.add(dimLabel(o));
  row.keywords = [...kw];

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
console.log("[patch-yatay-sogutucu] toplam:", total);
