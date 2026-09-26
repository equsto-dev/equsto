#!/usr/bin/env node
/**
 * Sitedeki Şenox ürünlerini SENOX 2026-2-1 PDF kataloğuyla eşleştirir;
 * yeni katalogda olmayan site ürünlerinin listesini çıkarır.
 *
 *   node scripts/list-senox-not-in-pdf-catalog.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  candidateKeys,
  findPdfListPrice,
  loadSenoxPdfCatalog,
  normSenoxKey,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const OUT_DIR = path.join(ROOT, "scripts/data/senox");
const OUT_JSON = path.join(OUT_DIR, "senox-katalogda-olmayan.json");
const OUT_MD = path.join(OUT_DIR, "senox-katalogda-olmayan.md");
const OUT_CSV = path.join(OUT_DIR, "senox-katalogda-olmayan.csv");

function isSenoxRow(r) {
  const k = String(r?.kaynak_fiyat_listesi || r?.kaynak || "").toLowerCase();
  return k.includes("senox") || String(r?.id || "").startsWith("senox__");
}

async function loadSenoxRows() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (isSenoxRow(r)) rows.push({ ...r, dept_file: f });
    }
  }
  return rows;
}

function buildCatalogKeySet(pdfCatalog) {
  const keys = new Set();
  for (const [k] of pdfCatalog.index) keys.add(k);
  for (const p of pdfCatalog.products || []) {
    for (const raw of [p.model, p.title]) {
      const k = normSenoxKey(raw);
      if (k) keys.add(k);
    }
  }
  return keys;
}

function rowMatchesCatalog(row, catalogKeys, pdfCatalog) {
  const ref = {
    model: row.model,
    mutbexCode: row.sku || row.urun_kodu,
    sku: row.sku,
    urun_kodu: row.urun_kodu,
  };
  const hit = findPdfListPrice(ref, pdfCatalog.index, pdfCatalog.products);
  if (hit?.listeEur > 0 || hit?.matchKey) {
    return { matched: true, matchKey: hit.matchKey || "", listeEur: hit.listeEur || null };
  }
  for (const k of candidateKeys(ref)) {
    if (catalogKeys.has(k)) return { matched: true, matchKey: k, listeEur: null };
  }
  if (row.senox_pdf_match && catalogKeys.has(normSenoxKey(row.senox_pdf_match))) {
    return { matched: true, matchKey: normSenoxKey(row.senox_pdf_match), listeEur: null };
  }
  return { matched: false, matchKey: "", listeEur: null };
}

async function main() {
  const pdfCatalog = loadSenoxPdfCatalog();
  const catalogKeys = buildCatalogKeySet(pdfCatalog);
  const rows = await loadSenoxRows();

  const matched = [];
  const notInCatalog = [];

  for (const row of rows) {
    const m = rowMatchesCatalog(row, catalogKeys, pdfCatalog);
    const entry = {
      id: row.id,
      model: row.model,
      sku: row.sku || row.urun_kodu || "",
      name: row.name,
      dept: row.dept_file,
      liste_fiyati_eur: row.liste_fiyati_eur ?? null,
      satis_fiyati_eur: row.satis_fiyati_eur ?? null,
      fiyat_tl: row.fiyat_tl ?? null,
      kaynak: row.kaynak_fiyat_listesi || row.kaynak || "",
      senox_pdf_match: row.senox_pdf_match || "",
      senox_mutbex_match: row.senox_mutbex_match || "",
      images: row.images || [],
      matchKey: m.matchKey,
      catalog_liste_eur: m.listeEur,
    };
    if (m.matched) matched.push(entry);
    else notInCatalog.push(entry);
  }

  notInCatalog.sort((a, b) => String(a.model || "").localeCompare(String(b.model || ""), "tr"));

  const mutbexOnly = notInCatalog.filter((p) =>
    String(p.kaynak || "").toLowerCase().includes("mutbex"),
  );
  const cafeOrOther = notInCatalog.filter(
    (p) => !String(p.kaynak || "").toLowerCase().includes("mutbex"),
  );
  const noPrice = notInCatalog.filter(
    (p) => !(Number(p.liste_fiyati_eur) > 0) && !(Number(p.satis_fiyati_eur) > 0),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    catalog: pdfCatalog.liste || "SENOX 2026-2-1",
    catalogSource: pdfCatalog.source || "",
    catalogProducts: pdfCatalog.products.length,
    catalogIndexKeys: pdfCatalog.index.size,
    siteSenoxTotal: rows.length,
    matchedInCatalog: matched.length,
    notInCatalog: notInCatalog.length,
    notInCatalogMutbexPriced: mutbexOnly.length,
    notInCatalogOtherSource: cafeOrOther.length,
    notInCatalogNoPrice: noPrice.length,
    products: notInCatalog,
    mutbexOnly,
    otherSource: cafeOrOther,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const tableRows = (list) =>
    list.map((r) => {
      const name = String(r.name || "").replace(/\|/g, "/").slice(0, 60);
      return `| ${r.model || ""} | ${r.sku || ""} | ${name} | ${r.liste_fiyati_eur ?? "—"} | ${r.satis_fiyati_eur ?? "—"} | ${r.fiyat_tl ?? "—"} | ${r.kaynak || ""} |`;
    });

  const md = [
    "# Sitede var, SENOX 2026-2-1 kataloğunda yok",
    "",
    `**Tarih:** ${report.generatedAt}`,
    `**Katalog:** ${report.catalog} (${report.catalogProducts} ürün)`,
    `**Site Şenox:** ${report.siteSenoxTotal}`,
    `**Eşleşen (PDF katalogda var):** ${report.matchedInCatalog}`,
    `**Katalogda olmayan:** **${report.notInCatalog}**`,
    `  - Mutbex fiyatlı: ${mutbexOnly.length}`,
    `  - Diğer kaynak / CafeMarkt: ${cafeOrOther.length}`,
    `  - Liste/satış EUR yok: ${noPrice.length}`,
    "",
    "## Mutbex’te var, PDF katalogda yok",
    "",
    "| Model | SKU | Ad | Liste € | Satış € | TL KDV dah. | Kaynak |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...tableRows(mutbexOnly),
    "",
    "## Diğer kaynak (CafeMarkt vb.) — PDF katalogda yok",
    "",
    "| Model | SKU | Ad | Liste € | Satış € | TL KDV dah. | Kaynak |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...tableRows(cafeOrOther),
    "",
  ].join("\n");
  fs.writeFileSync(OUT_MD, md, "utf8");

  const csv = [
    "model;sku;name;liste_eur;satis_eur;fiyat_tl;kaynak;id;dept;group",
    ...notInCatalog.map((r) => {
      const group = String(r.kaynak || "").toLowerCase().includes("mutbex")
        ? "mutbex-only"
        : "other";
      return [
        r.model || "",
        r.sku || "",
        `"${String(r.name || "").replace(/"/g, '""')}"`,
        r.liste_fiyati_eur ?? "",
        r.satis_fiyati_eur ?? "",
        r.fiyat_tl ?? "",
        r.kaynak || "",
        r.id || "",
        r.dept || "",
        group,
      ].join(";");
    }),
  ].join("\n");
  fs.writeFileSync(OUT_CSV, csv, "utf8");

  console.log(
    `[senox-not-in-catalog] site=${rows.length} | eşleşen=${matched.length} | katalogda olmayan=${notInCatalog.length} (mutbex=${mutbexOnly.length}, diğer=${cafeOrOther.length}, fiyatsız=${noPrice.length})`,
  );
  console.log(`→ ${OUT_MD}`);
  if (notInCatalog.length) {
    console.log(
      "  örnek:",
      notInCatalog
        .slice(0, 15)
        .map((r) => r.model || r.sku)
        .join(", "),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
