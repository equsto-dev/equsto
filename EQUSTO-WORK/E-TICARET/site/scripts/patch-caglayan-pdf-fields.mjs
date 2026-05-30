/**
 * market-reyon.json — Çağlayan satırlarına katalog PDF + özellik / teknik akordeon alanları.
 * Görsel kopyalamaz (hızlı). Tam import: import-caglayan-market-reyon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCaglayanTeknikAkordeon,
  extractCaglayanCatalogPdf,
  extractCaglayanOzellikler,
} from "./lib/caglayan-catalog-pdf.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../../PFOS/veri/proje-veri/caglayan-refrigeration");
const OUT_DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const URUN_DIR = path.join(SRC, "urun-sayfalari");

const urunCache = new Map();

function loadUrun(slug) {
  if (!slug) return null;
  if (urunCache.has(slug)) return urunCache.get(slug);
  const p = path.join(URUN_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) {
    urunCache.set(slug, null);
    return null;
  }
  const urun = JSON.parse(fs.readFileSync(p, "utf8"));
  urunCache.set(slug, urun);
  return urun;
}

const rows = JSON.parse(fs.readFileSync(OUT_DEPT, "utf8"));
let n = 0;
for (const row of rows) {
  if (row.kaynak !== "caglayan-refrigeration") continue;
  const slug = row.caglayanModelSlug || row.id;
  const urun = loadUrun(slug);
  if (!urun) continue;
  const pdf = extractCaglayanCatalogPdf(urun, SRC);
  const oz = extractCaglayanOzellikler(urun);
  const ak = buildCaglayanTeknikAkordeon(urun);
  row.caglayanOzellikler = oz.length ? oz : undefined;
  row.caglayanTeknikAkordeon = ak.length ? ak : undefined;
  row.caglayanKatalogPdf = pdf?.rel || undefined;
  row.caglayanKatalogUrl = pdf?.url || undefined;
  row.caglayanKatalogAdi = pdf?.fileName || undefined;
  n++;
}
fs.writeFileSync(OUT_DEPT, JSON.stringify(rows), "utf8");
console.log("[patch-caglayan-pdf] güncellenen satır:", n);
