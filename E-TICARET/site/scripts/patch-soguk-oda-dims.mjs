/**
 * Soğuk oda (7919.CR*) ürün adlarına PDF ölçülerini yazar.
 *   node scripts/patch-soguk-oda-dims.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF = path.join(ROOT, "scripts/data/ozti-katalog-pdf-2026.json");
const TARGETS = [
  path.join(ROOT, "public/data/dept/sogutma.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/sogutma.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/ekipmanlar.json"),
];

function loadDimMap() {
  const pdf = JSON.parse(fs.readFileSync(PDF, "utf8"));
  const map = new Map();
  for (const e of pdf) {
    const t = (e.pdf_metin_parcalari || []).join("\n");
    if (!t.includes("7919.CR")) continue;
    const re = /7919\.CR\d{4}\.00/g;
    let m;
    while ((m = re.exec(t))) {
      const code = m[0];
      const tail = t.slice(m.index + code.length, m.index + code.length + 80);
      const nums = tail.match(/(\d{3,4})/g);
      if (nums && nums.length >= 3) {
        map.set(code, {
          genislik_mm: +nums[0],
          derinlik_mm: +nums[1],
          yukseklik_mm: +nums[2],
        });
      }
    }
  }
  return map;
}

function dimLabel(o) {
  const g = Math.round(o.genislik_mm / 10);
  const d = Math.round(o.derinlik_mm / 10);
  const y = Math.round(o.yukseklik_mm / 10);
  return `${g}×${d}×${y} cm`;
}

function roomModel(o) {
  return `ROOM ${Math.round(o.genislik_mm / 10)}`;
}

function patchRow(row, dims) {
  if (!/^7919\.CR/i.test(String(row.sku || row.urun_kodu || row.model || ""))) return false;
  const kod = String(row.sku || row.urun_kodu || row.model || "").trim();
  const o = dims.get(kod);
  if (!o) {
    console.warn("[warn] ölçü yok:", kod);
    return false;
  }

  const label = dimLabel(o);
  const name = `SOĞUK ODA ${label}`;
  const tip =
    "Panel-split soğuk oda, 0/+5 °C. İç ölçüler (G×D×Y): " +
    label +
    ". Ürün kodu: " +
    kod +
    ".";

  row.name = name;
  row.model = roomModel(o);
  row.olculer = { ...o };
  row.aciklama = tip;
  if (!row.description) row.description = tip;

  const specsHead = `${name}\n\n${tip}\n\n`;
  const rest = String(row.specs || "")
    .replace(/^[\s\S]*?(?=Ürün kodu:|Kaynak:|Liste fiyatı)/i, "")
    .trim();
  row.specs = specsHead + (rest || `Ürün kodu: ${kod}`);

  const kw = new Set(Array.isArray(row.keywords) ? row.keywords : []);
  kw.add("Soğuk Oda");
  kw.add("Soğuk Odalar");
  kw.add(kod);
  kw.add(label);
  kw.add(row.model);
  row.keywords = [...kw];

  return true;
}

function patchFile(fp, dims) {
  if (!fs.existsSync(fp)) {
    console.log("[skip]", fp);
    return 0;
  }
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const row of rows) {
    if (patchRow(row, dims)) n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
  console.log("[ok]", fp, n);
  return n;
}

const dims = loadDimMap();
console.log("[patch-soguk-oda] PDF ölçü:", dims.size);
let total = 0;
for (const f of TARGETS) total += patchFile(f, dims);
console.log("[patch-soguk-oda] toplam:", total);
