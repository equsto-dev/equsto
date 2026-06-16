/**
 * Mevcut Proso katalog satırlarına model kodundan derinlik/yükseklik ekler; adları günceller.
 * Kullanım: node scripts/patch-proso-olculer-dims.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { variantDisplayName } from "./lib/caglayan-variants.mjs";
import { enrichProsoOlculer } from "./lib/proso-model-dims.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function baslikFromRow(row) {
  const model = String(row.model || "");
  const m = model.match(/^EQ-(.+?)\s+EQ\d+$/i);
  if (m) return m[1];
  const name = String(row.name || "");
  const m2 = name.match(/^EQ-(.+?)\s+EQ\d+/i);
  if (m2) return m2[1];
  return row.series || "Proso";
}

function patchRow(row) {
  if (!row || row.kaynak !== "prosogutma") return { row, changed: false };
  const kod = row.prosoModelKod || "";
  const nextOlculer = enrichProsoOlculer(row.olculer, kod);
  const o = row.olculer || {};
  const olcuChanged =
    Number(o.derinlik_mm) !== Number(nextOlculer.derinlik_mm) ||
    Number(o.yukseklik_mm) !== Number(nextOlculer.yukseklik_mm);

  const eqNo = Number(row.prosoEqNo) || 1;
  const v = {
    modelKod: kod,
    genislik_mm: nextOlculer.genislik_mm || 0,
    derinlik_mm: nextOlculer.derinlik_mm || 0,
    yukseklik_mm: nextOlculer.yukseklik_mm || 0,
  };
  const name = variantDisplayName(baslikFromRow(row), v, eqNo);
  const nameChanged = name !== row.name;

  if (!olcuChanged && !nameChanged) return { row, changed: false };

  return {
    row: { ...row, olculer: nextOlculer, name },
    changed: true,
  };
}

function patchArray(rows, label) {
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const { row, changed } = patchRow(rows[i]);
    if (changed) {
      rows[i] = row;
      n++;
    }
  }
  console.log(`  ${label}: ${n} satır`);
  return n;
}

function patchJson(relPath, getRows, setRows) {
  const file = join(ROOT, relPath);
  const data = JSON.parse(readFileSync(file, "utf8"));
  const rows = getRows(data);
  const n = patchArray(rows, relPath);
  if (n) {
    setRows(data, rows);
    writeFileSync(file, JSON.stringify(data));
  }
  return n;
}

let total = 0;
total += patchJson(
  "public/data/dept/market-reyon.json",
  (d) => d,
  (d) => d
);
total += patchJson(
  "public/data/proje-akis.json",
  (d) => d.data?.products || d.products || [],
  (d, rows) => {
    if (d.data?.products) d.data.products = rows;
    else d.products = rows;
  }
);
total += patchJson(
  "public/data/homepage-vitrin.json",
  (d) => d.products || [],
  (d, rows) => {
    d.products = rows;
  }
);

console.log(`Toplam: ${total} satır güncellendi`);
