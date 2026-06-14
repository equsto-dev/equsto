#!/usr/bin/env node
/** Senox dept fiyat kaynağı özeti → scripts/data/senox/price-audit.json */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const OUT = path.join(ROOT, "scripts/data/senox/price-audit.json");

async function main() {
  const pdf = loadSenoxPdfCatalog();
  const mut = loadMutbexCatalog();
  const rows = [];

  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (r.kaynak !== "senox-mutbex" && !String(r.id || "").startsWith("senox__")) continue;
      const ref = { model: r.model, mutbexCode: r.sku, sku: r.sku, urun_kodu: r.urun_kodu };
      const pdfM = findPdfListPrice(ref, pdf.index, pdf.products);
      const mutM = pdfM ? null : findMutbexListPrice(ref, mut.index);
      rows.push({
        model: r.model,
        sku: r.sku,
        name: r.name,
        liste: r.liste_fiyati_eur,
        satis_eur: r.satis_fiyati_eur,
        fiyat_tl: r.fiyat_tl,
        kaynak: r.kaynak_fiyat_listesi,
        pdf_liste: pdfM?.listeEur ?? null,
        pdf_key: pdfM?.matchKey ?? "",
        mut_liste: mutM?.listeEur ?? null,
      });
    }
  }

  const fromPdf = rows.filter((r) => r.kaynak === "senox-pdf-2026-1");
  const fromMut = rows.filter((r) => r.kaynak === "senox-mutbex-liste");
  const conflict = rows.filter(
    (r) =>
      r.pdf_liste &&
      r.mut_liste &&
      Math.abs(r.pdf_liste - r.mut_liste) / Math.max(r.pdf_liste, r.mut_liste) > 0.12,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    pdfProducts: pdf.products.length,
    pdfIndexKeys: pdf.index.size,
    totalSenoxRows: rows.length,
    fromPdf: fromPdf.length,
    fromMutbex: fromMut.length,
    pdfMutbexConflict: conflict.length,
    samples: Object.fromEntries(
      ["DT-100", "DT-12", "160-LK", "300-LK", "DT-18", "DT-24", "SNX-17-C", "VM01", "YSO-100"].map(
        (m) => {
          const hit = rows.find((x) => x.model === m);
          return [m, hit || null];
        },
      ),
    ),
    mutbexOnly: fromMut.map((r) => ({
      model: r.model,
      sku: r.sku,
      liste: r.liste,
      pdf_liste: r.pdf_liste,
    })),
    conflicts: conflict.slice(0, 40),
    rows,
  };

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
  console.log(`[audit] ${rows.length} satır | PDF: ${fromPdf.length} | Mutbex: ${fromMut.length} | çakışma: ${conflict.length}`);
  console.log(`  -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
