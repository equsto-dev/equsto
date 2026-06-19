#!/usr/bin/env node
/**
 * Şenox: Equsto × PDF × Mutbex derin karşılaştırma (%50 satış)
 *   node scripts/compare-senox-mutbex-deep.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
  normSenoxKey,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const OUT = path.join(ROOT, "scripts/data/senox/mutbex-karsilastirma-deep.json");
const SATIS_ORAN = 0.5;

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round((Math.abs(a - b) / Math.max(a, b)) * 1000) / 10;
}

function bucket(pct) {
  if (pct == null) return "tek-kaynak";
  if (pct <= 5) return "0-5%";
  if (pct <= 10) return "5-10%";
  if (pct <= 20) return "10-20%";
  if (pct <= 35) return "20-35%";
  if (pct <= 50) return "35-50%";
  return "50%+";
}

function satis(liste) {
  return liste > 0 ? Math.round(liste * SATIS_ORAN * 100) / 100 : 0;
}

async function loadEqustoSenox() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (r.kaynak !== "senox-mutbex" && !String(r.id || "").startsWith("senox__")) continue;
      rows.push({ ...r, deptFile: f.replace(".json", "") });
    }
  }
  return rows;
}

function pdfByKey(products) {
  const map = new Map();
  for (const p of products) {
    const k = normSenoxKey(p.model);
    if (k) map.set(k, p);
  }
  return map;
}

function mutbexByKey(products) {
  const map = new Map();
  for (const p of products) {
    for (const k of [normSenoxKey(p.model), normSenoxKey(p.mutbexCode)]) {
      if (k && !map.has(k)) map.set(k, p);
    }
  }
  return map;
}

async function main() {
  const pdfCat = loadSenoxPdfCatalog();
  const mutCat = loadMutbexCatalog();
  const equsto = await loadEqustoSenox();

  const compared = [];
  for (const r of equsto) {
    const ref = { model: r.model, mutbexCode: r.sku, sku: r.sku, urun_kodu: r.urun_kodu };
    const pdfM = findPdfListPrice(ref, pdfCat.index, pdfCat.products);
    const mutM = findMutbexListPrice(ref, mutCat.index);
    const pdfListe = pdfM?.listeEur ?? null;
    const mutListe = mutM?.listeEur ?? null;
    const pdfSatis = pdfListe ? satis(pdfListe) : null;
    const mutSatis = mutListe ? satis(mutListe) : null;
    const listeDiff = pctDiff(pdfListe, mutListe);
    const satisDiff = pctDiff(pdfSatis, mutSatis);
    const equstoSatis = r.satis_fiyati_eur ?? satis(r.liste_fiyati_eur);
    const kaynak = r.kaynak_fiyat_listesi || "";
    compared.push({
      id: r.id,
      model: r.model,
      sku: r.sku,
      name: r.name,
      dept: r.dept || r.deptFile,
      equsto_liste: r.liste_fiyati_eur,
      equsto_satis: equstoSatis,
      equsto_tl: r.fiyat_tl,
      kaynak,
      pdf_liste: pdfListe,
      pdf_satis: pdfSatis,
      pdf_key: pdfM?.matchKey || "",
      mut_liste: mutListe,
      mut_satis: mutSatis,
      mut_code: mutM?.mutbexCode || "",
      mut_raw_satis: mutM?.satisEur ?? null,
      liste_diff_pct: listeDiff,
      satis_diff_pct: satisDiff,
      diff_bucket: bucket(listeDiff),
      pdf_cheaper: pdfListe && mutListe ? pdfListe < mutListe : null,
      equsto_vs_pdf_satis_pct: pctDiff(equstoSatis, pdfSatis),
      equsto_vs_mut_satis_pct: pctDiff(equstoSatis, mutSatis),
    });
  }

  const both = compared.filter((r) => r.pdf_liste && r.mut_liste);
  const pdfOnly = compared.filter((r) => r.pdf_liste && !r.mut_liste);
  const mutOnly = compared.filter((r) => !r.pdf_liste && r.mut_liste);
  const neither = compared.filter((r) => !r.pdf_liste && !r.mut_liste);

  const buckets = {};
  for (const r of both) {
    buckets[r.diff_bucket] = (buckets[r.diff_bucket] || 0) + 1;
  }

  const pdfCheaper = both.filter((r) => r.pdf_cheaper);
  const mutCheaper = both.filter((r) => !r.pdf_cheaper);
  const bigDiff = [...both].sort((a, b) => (b.liste_diff_pct || 0) - (a.liste_diff_pct || 0));
  const closeMatch = both.filter((r) => (r.liste_diff_pct || 99) <= 10);

  // Mutbex scrape şüpheli: liste > 20000 veya satış/liste oranı garip
  const mutSuspicious = compared.filter(
    (r) =>
      r.mut_liste &&
      (r.mut_liste > 25000 ||
        (r.mut_raw_satis && r.mut_liste / r.mut_raw_satis > 2.05) ||
        (r.mut_raw_satis && r.mut_liste / r.mut_raw_satis < 1.95)),
  );

  // PDF katalog × Mutbex katalog (Equsto dışı eşleşmeler)
  const pdfMap = pdfByKey(pdfCat.products);
  const mutMap = mutbexByKey(mutCat.products);
  const catalogCross = [];
  const equstoKeys = new Set(compared.map((r) => normSenoxKey(r.model)));
  for (const [k, pp] of pdfMap) {
    const mp = mutMap.get(k);
    if (!mp) continue;
    const pdfListe = Number(pp.specs?.fiyat_eur) || 0;
    const mutListe = mutCat.index.get(k)?.listeEur || 0;
    if (!(pdfListe > 0) || !(mutListe > 0)) continue;
    catalogCross.push({
      key: k,
      pdf_model: pp.model,
      mut_model: mp.model,
      pdf_liste: pdfListe,
      mut_liste: mutListe,
      diff_pct: pctDiff(pdfListe, mutListe),
      in_equsto: equstoKeys.has(k),
    });
  }
  catalogCross.sort((a, b) => (b.diff_pct || 0) - (a.diff_pct || 0));

  // Mutbex'te olup PDF'te olmayan — Equsto'da mut-only
  const mutOnlyDetail = mutOnly.map((r) => {
    const mk = normSenoxKey(r.model);
    const mp = mutMap.get(mk);
    return {
      ...r,
      mutbex_title: mp?.title || "",
      mutbex_url: mp?.url || "",
      mutbex_category: mp?.category || "",
    };
  });

  // PDF'te olup Mutbex'te yok — eşleştirme adayları
  const pdfOnlyInMutbex = [];
  for (const p of pdfCat.products) {
    const k = normSenoxKey(p.model);
    if (mutMap.has(k)) continue;
    const pdfListe = Number(p.specs?.fiyat_eur) || 0;
    if (!(pdfListe > 0)) continue;
    pdfOnlyInMutbex.push({
      model: p.model,
      page: p.page,
      category: p.category,
      pdf_liste: pdfListe,
      in_equsto: equstoKeys.has(k),
    });
  }

  const avgDiff =
    both.length > 0
      ? Math.round((both.reduce((s, r) => s + (r.liste_diff_pct || 0), 0) / both.length) * 10) / 10
      : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    satisOran: SATIS_ORAN,
    summary: {
      equstoTotal: compared.length,
      bothSources: both.length,
      pdfOnlyEqusto: pdfOnly.length,
      mutOnlyEqusto: mutOnly.length,
      neither: neither.length,
      avgListeDiffPct: avgDiff,
      closeMatchWithin10Pct: closeMatch.length,
      pdfCheaperCount: pdfCheaper.length,
      mutCheaperCount: mutCheaper.length,
      diffBuckets: buckets,
      mutSuspiciousCount: mutSuspicious.length,
      pdfCatalogProducts: pdfCat.products.length,
      mutbexCatalogProducts: mutCat.products.length,
      catalogCrossMatch: catalogCross.length,
      pdfNotInMutbex: pdfOnlyInMutbex.length,
    },
    topDiff: bigDiff.slice(0, 40),
    closeMatch: closeMatch.slice(0, 20),
    mutSuspicious: mutSuspicious.slice(0, 30),
    mutOnlyEqusto: mutOnlyDetail,
    pdfOnlyEqusto: pdfOnly,
    catalogCrossTopDiff: catalogCross.slice(0, 50),
    pdfNotInMutbexSample: pdfOnlyInMutbex.slice(0, 40),
    byDept: Object.fromEntries(
      [...new Set(compared.map((r) => r.dept))].map((d) => {
        const sub = compared.filter((r) => r.dept === d);
        const b = sub.filter((r) => r.pdf_liste && r.mut_liste);
        return [
          d,
          {
            total: sub.length,
            both: b.length,
            pdfUsed: sub.filter((r) => r.kaynak === "senox-pdf-2026-1").length,
            mutUsed: sub.filter((r) => r.kaynak === "senox-mutbex-liste").length,
            avgDiff: b.length
              ? Math.round((b.reduce((s, r) => s + (r.liste_diff_pct || 0), 0) / b.length) * 10) / 10
              : null,
          },
        ];
      }),
    ),
    rows: compared,
  };

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");

  console.log("[mutbex-deep] Equsto Şenox:", compared.length);
  console.log("  Her iki kaynak:", both.length, "| ort. liste fark:", avgDiff + "%");
  console.log("  PDF ucuz:", pdfCheaper.length, "| Mutbex ucuz:", mutCheaper.length);
  console.log("  ±10% yakın:", closeMatch.length, "| Fark 50%+:", buckets["50%+"] || 0);
  console.log("  Mutbex-only (Equsto):", mutOnly.length, "| PDF-only:", pdfOnly.length);
  console.log("  Mutbex şüpheli scrape:", mutSuspicious.length);
  console.log("  PDF×Mutbex katalog çapraz:", catalogCross.length);
  console.log("\n  En büyük farklar (liste EUR):");
  for (const r of bigDiff.slice(0, 8)) {
    console.log(
      `    ${r.model.padEnd(14)} PDF ${String(r.pdf_liste).padStart(6)} | Mut ${String(r.mut_liste).padStart(8)} (${r.liste_diff_pct}%) → Equsto ${r.equsto_satis} EUR [${r.kaynak}]`,
    );
  }
  console.log("\n  Yakın eşleşmeler (≤10%):");
  for (const r of closeMatch.slice(0, 6)) {
    console.log(`    ${r.model}: PDF ${r.pdf_liste} / Mut ${r.mut_liste} (${r.liste_diff_pct}%)`);
  }
  console.log("\n  ->", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
