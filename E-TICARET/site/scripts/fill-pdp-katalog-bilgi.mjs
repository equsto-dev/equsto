/**
 * Ürün sayfası açıklama + ölçü + elektrik/gaz.
 * 1) Katalog kaynakları
 * 2) Cafemarkt (rakip) — aynı stok kodu katalogda varsa oradan, yoksa sayfadaki ölçü
 *
 *   node scripts/fill-pdp-katalog-bilgi.mjs          # yazar
 *   node scripts/fill-pdp-katalog-bilgi.mjs --dry    # sadece sayım
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyDescription,
  applyDimsToRow,
  applyEnergyLines,
  cleanMixedEnergy,
  decodeCatalogText,
  isCompetitorSource,
  parseProductDims,
  productSkuKeys,
} from "./lib/pdp-katalog-specs.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function loadExtraBySku() {
  const map = new Map();
  const put = (key, text) => {
    const k = norm(key);
    if (k.length < 3 || !text) return;
    const prev = map.get(k);
    map.set(k, prev ? prev + "\n" + text : text);
  };

  const gastroPath = path.join(ROOT, "scripts/data/gastrotech/gastrotech-catalog-extracted.json");
  if (fs.existsSync(gastroPath)) {
    const j = readJson(gastroPath);
    for (const p of j.products || []) {
      if (!p.dims) continue;
      put(p.model, `Ölçü: ${p.dims} mm`);
    }
  }

  const remtaPath = path.join(ROOT, "scripts/data/remta-catalog-2026-extracted.json");
  if (fs.existsSync(remtaPath)) {
    const rows = readJson(remtaPath);
    for (const p of rows) {
      const text = [p.description, p.specs].filter(Boolean).join("\n");
      put(p.code, text);
    }
  }

  const protekPath = path.join(ROOT, "scripts/data/protek/protek-catalog.json");
  if (fs.existsSync(protekPath)) {
    const j = readJson(protekPath);
    for (const p of j.products || []) {
      const bits = [];
      if (p.dims) bits.push(`Ölçü: ${p.dims} mm`);
      if (p.size) bits.push(`Ölçü: ${p.size} mm`);
      if (p.olcu) bits.push(`Ölçü: ${p.olcu} mm`);
      if (Array.isArray(p.features)) bits.push(p.features.join("\n"));
      if (p.description) bits.push(p.description);
      put(p.code || p.model, bits.join("\n"));
    }
  }

  return map;
}

function extraFor(row, map) {
  const chunks = [];
  for (const k of productSkuKeys(row)) {
    const hit = map.get(k);
    if (hit) chunks.push(hit);
  }
  return chunks.join("\n");
}

function dimSnapshot(row) {
  const o = row.olculer;
  if (!o || typeof o !== "object") return "";
  return [o.genislik_mm || o.uzunluk_mm || "", o.derinlik_mm || "", o.yukseklik_mm || ""].join("x");
}

const extraMap = loadExtraBySku();
const files = fs
  .readdirSync(DEPT)
  .filter((f) => f.endsWith(".json") && !f.includes("brema"))
  .map((f) => path.join(DEPT, f));

const catalogRows = [];
const rivalRows = [];
const fileItems = [];

for (const file of files) {
  const items = readJson(file);
  if (!Array.isArray(items)) continue;
  fileItems.push({ file, items });
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    if (isCompetitorSource(row)) rivalRows.push(row);
    else catalogRows.push(row);
  }
}

const stats = {
  katalog: 0,
  olcu: 0,
  aciklama: 0,
  enerji: 0,
  rakip: 0,
  rakipKatalogdan: 0,
  rakipOlcu: 0,
  rakipAciklama: 0,
};

const samples = [];

function enrich(row, extra) {
  const beforeDim = dimSnapshot(row);
  const dims = parseProductDims(row, extra);
  const dimChanged = applyDimsToRow(row, dims);
  const descChanged = applyDescription(row);
  const energyChanged = applyEnergyLines(row);
  const cleaned = cleanMixedEnergy(row);
  return { dimChanged, descChanged, energyChanged: energyChanged || cleaned, beforeDim, afterDim: dimSnapshot(row) };
}

for (const row of catalogRows) {
  stats.katalog++;
  const r = enrich(row, extraFor(row, extraMap));
  if (r.dimChanged) stats.olcu++;
  if (r.descChanged) stats.aciklama++;
  if (r.energyChanged) stats.enerji++;
  if (r.dimChanged && samples.length < 12) {
    samples.push({
      sku: row.sku || row.model,
      name: String(row.name || "").slice(0, 70),
      before: r.beforeDim,
      after: r.afterDim,
      kaynak: row.kaynak_fiyat_listesi,
    });
  }
}

const bySku = new Map();
for (const row of catalogRows) {
  const desc = decodeCatalogText(row.description);
  const o = row.olculer && typeof row.olculer === "object" ? row.olculer : null;
  const hasDim = o && (Number(o.genislik_mm) >= 40 || Number(o.uzunluk_mm) >= 40);
  if (!desc && !hasDim) continue;
  for (const k of productSkuKeys(row)) {
    if (!bySku.has(k)) bySku.set(k, row);
  }
}

for (const row of rivalRows) {
  stats.rakip++;
  let donor = null;
  for (const k of productSkuKeys(row)) {
    if (bySku.has(k)) {
      donor = bySku.get(k);
      break;
    }
  }
  if (donor) {
    stats.rakipKatalogdan++;
    const name = decodeCatalogText(row.name);
    const own = decodeCatalogText(row.description);
    const donorDesc = decodeCatalogText(donor.description);
    if (donorDesc.length >= 40 && (own === name || own.length < 40)) {
      row.description = donor.description;
      if (!decodeCatalogText(row.aciklama)) row.aciklama = donor.description;
      stats.rakipAciklama++;
    }
    const o = row.olculer;
    const hasDim = o && typeof o === "object" && (Number(o.genislik_mm) >= 40 || Number(o.uzunluk_mm) >= 40);
    const d = donor.olculer;
    const donorDim = d && typeof d === "object" && (Number(d.genislik_mm) >= 40 || Number(d.uzunluk_mm) >= 40);
    if (!hasDim && donorDim) {
      row.olculer = { ...d };
      if (donor.olcu_etiket) row.olcu_etiket = donor.olcu_etiket;
      stats.rakipOlcu++;
    }
    const have = new Set((row.teknik_ozellikler || []).map((l) => String(l)));
    const take = (donor.teknik_ozellikler || []).filter((l) =>
      /^(elektrik|gaz)\s|voltaj|frekans|g[uü][çc]\s*:|genişlik|derinlik|yükseklik/i.test(String(l)),
    );
    const add = take.filter((l) => !have.has(String(l)));
    if (add.length) row.teknik_ozellikler = [...(row.teknik_ozellikler || []), ...add];
  }
  const r = enrich(row, "");
  if (r.dimChanged) stats.rakipOlcu++;
  if (r.descChanged) stats.rakipAciklama++;
}

console.log(JSON.stringify(stats, null, 2));
console.log("--- olcu ornek ---");
for (const s of samples) console.log(s.kaynak, s.sku, s.before, "->", s.after, "|", s.name);

if (DRY) {
  console.log("dry — dosya yazılmadı");
  process.exit(0);
}

for (const { file, items } of fileItems) {
  fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
}
console.log("yazildi", fileItems.length, "dept dosyasi");
