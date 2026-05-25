/**
 * NTV T1 havuzlu dolap (7919.27/37/47NTV.T1) — PDF ölçüleri + yazım düzeltmesi.
 *   node scripts/patch-ntv-t1-havuzlu-dolap.mjs
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

/** Öztiryakiler PDF 2026 — tezgah tipi havuzlu dolap dış ölçüleri (mm). */
const BY_SKU = {
  "7919.27NTV.T1": { genislik_mm: 1420, derinlik_mm: 700, yukseklik_mm: 850, guc_kw: "0.40" },
  "7919.37NTV.T1": { genislik_mm: 1880, derinlik_mm: 700, yukseklik_mm: 850, guc_kw: "0.50" },
  "7919.47NTV.T1": { genislik_mm: 2400, derinlik_mm: 700, yukseklik_mm: 850, guc_kw: "0.60" },
};

function dimLabel(o) {
  return `${o.genislik_mm}×${o.derinlik_mm}×${o.yukseklik_mm} mm`;
}

function patchRow(row) {
  const sku = String(row.sku || row.urun_kodu || "").trim().toUpperCase();
  const dims = BY_SKU[sku];
  if (!dims) return false;

  if (/HUVUZLU/i.test(String(row.name || ""))) {
    row.name = String(row.name).replace(/HUVUZLU/gi, "HAVUZLU");
  }

  row.olculer = { ...dims };
  const line = `En×Boy×Yükseklik: ${dimLabel(dims)}`;
  if (!Array.isArray(row.teknik_ozellikler)) row.teknik_ozellikler = [];
  const rest = row.teknik_ozellikler.filter((t) => !/^En×Boy×Yükseklik:/i.test(String(t)));
  row.teknik_ozellikler = [line, ...rest];

  const kod = sku;
  const block = `${line}\nÜrün kodu: ${kod}`;
  if (row.specs && !row.specs.includes("En×Boy×Yükseklik")) {
    row.specs = row.specs.replace(/^[\s\S]*?(?=Ürün kodu:|Liste fiyatı)/i, "") || row.specs;
    row.specs = `${String(row.name || "").trim()}\n\n${block}\n\n${String(row.specs || "").trim()}`.trim();
  }

  const kw = new Set(Array.isArray(row.keywords) ? row.keywords : []);
  kw.add(dimLabel(dims));
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
console.log("[patch-ntv-t1-havuzlu] toplam:", total);
