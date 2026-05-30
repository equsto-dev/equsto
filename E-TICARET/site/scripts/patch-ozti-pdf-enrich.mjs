/**
 * Öztiryakiler dept satırları — PDF G/D/Y tablosundan teknik alanları yeniden yazar.
 *   node scripts/patch-ozti-pdf-enrich.mjs
 *   node scripts/patch-ozti-pdf-enrich.mjs --dept kahve
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSpecs,
  isOztiBrand,
  loadPdfByKod,
  normKod,
  oztiPricingLines,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const EKIP = path.join(ROOT, "public/data/ekipmanlar.json");

function parseArgs() {
  const dept = process.argv.includes("--dept")
    ? process.argv[process.argv.indexOf("--dept") + 1]
    : "";
  return { dept };
}

function patchFile(file, pdfByKod, stats) {
  if (!fs.existsSync(file)) return;
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(rows)) return;
  let changed = 0;

  for (const row of rows) {
    if (!isOztiBrand(row)) continue;
    const kod = normKod(row.sku || row.urun_kodu || row.model);
    if (!kod) continue;
    const pdfEntry = pdfByKod.get(kod);
    if (!pdfEntry) continue;

    const fakeRow = {
      urun_kodu: kod,
      urun_tanimi: row.name,
      kategori: row.category,
      kategori_yolu: row.kategori_yolu || [],
      barkod: row.barkod,
    };
    const pricingLines = oztiPricingLines(
      {
        urun_kodu: kod,
        kategori: row.category,
        liste_fiyati_eur: row.liste_fiyati_eur ?? row.liste_fiyati,
        bayi_iskonto: row.bayi_iskonto,
        para_birimi: row.para_birimi,
        satis_fiyati_eur: row.satis_fiyati_eur ?? row.satis_eur_indirimli,
      },
      row.kur_eur_try || 53.3,
    );

    const enriched = buildSpecs(fakeRow, pdfEntry, row.category, pricingLines);
    const hadDims = Boolean(row.olculer?.genislik_mm);
    const hasDims = Boolean(enriched.olculer?.genislik_mm);
    if (!hasDims && hadDims) continue;

    row.specs = enriched.specs;
    row.aciklama = enriched.aciklama;
    row.teknik_ozellikler = enriched.teknik_ozellikler;
    row.olculer = enriched.olculer;
    row.keywords = enriched.keywords;
    changed++;
  }

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(rows));
    stats.files++;
    stats.rows += changed;
    console.log(`[patch-ozti] ${path.basename(file)} → ${changed} satır`);
  }
}

const { dept } = parseArgs();
const pdfByKod = loadPdfByKod();
const stats = { files: 0, rows: 0 };

if (dept) {
  patchFile(path.join(DEPT_DIR, `${dept}.json`), pdfByKod, stats);
} else {
  for (const f of fs.readdirSync(DEPT_DIR)) {
    if (!f.endsWith(".json")) continue;
    patchFile(path.join(DEPT_DIR, f), pdfByKod, stats);
  }
  patchFile(EKIP, pdfByKod, stats);
}

console.log(`[patch-ozti] bitti: ${stats.rows} satır, ${stats.files} dosya`);
