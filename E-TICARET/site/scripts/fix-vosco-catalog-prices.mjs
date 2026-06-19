#!/usr/bin/env node
/**
 * Vosco Katalog 2026 PDF — tam fiyat denetimi ve %52 iskonto (liste × 48%) düzeltmesi.
 *
 *   node scripts/fix-vosco-catalog-prices.mjs
 *   node scripts/fix-vosco-catalog-prices.mjs --dry-run
 *   node scripts/fix-vosco-catalog-prices.mjs --reextract
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";
import {
  findManualVoscoPrice,
  findPdfListPrice,
  findVoscoSitePrice,
  loadVoscoPdfCatalog,
  pricingFromVoscoPdfMatch,
  VOSCO_ISKONTO_ORAN,
  VOSCO_SATIS_ORAN,
} from "./lib/vosco-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const WEB = path.join(ROOT, "scripts/data/vosco/vosco-web-catalog.json");
const OUT_DIR = path.join(ROOT, "scripts/data/vosco");
const KDV = 20;
const dryRun = process.argv.includes("--dry-run");
const reextract = process.argv.includes("--reextract");

function isVoscoRow(r) {
  return String(r?.kaynak || "") === "vosco-web" || String(r?.id || "").startsWith("vosco__");
}

function fmtTl(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

function targetForWebProduct(p, usdTry, eurTry, pdfIndex, pdfProducts) {
  const manual = findManualVoscoPrice(p);
  if (manual) return { ...manual, kaynak: "vosco-manual-tl", pdf_match: null };
  const pdfMatch = findPdfListPrice(p, pdfIndex, pdfProducts);
  if (pdfMatch) {
    const px = pricingFromVoscoPdfMatch(pdfMatch, usdTry, eurTry, KDV, VOSCO_SATIS_ORAN);
    return { ...px, kaynak: "vosco-pdf-2026", pdf_match: pdfMatch };
  }
  const site = findVoscoSitePrice(p, KDV);
  if (site) return { ...site, kaynak: "vosco-site-tl", pdf_match: null };
  return null;
}

async function loadVoscoRows() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (isVoscoRow(r)) rows.push({ ...r, dept_file: f });
    }
  }
  return rows;
}

function writeReports(report) {
  const base = path.join(OUT_DIR, "vosco-fix-rapor");
  fs.writeFileSync(`${base}.json`, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# Vosco Katalog Fiyat Düzeltme Raporu",
    "",
    `**Tarih:** ${report.generatedAt}`,
    `**Kaynak:** Vosco Katalog 2026 PDF (${report.pdfProducts} ürün, ${report.pdfIndexKeys} kod)`,
    `**Formül:** Equsto = liste (USD/EUR→TL TCMB) × **48%** (%52 iskonto) × 1.20 KDV`,
    `**Kur:** 1 USD = ${report.kur_usd_try} TRY · 1 EUR = ${report.kur_eur_try} TRY`,
    dryRun ? "\n> **DRY-RUN** — dosyalara yazılmadı\n" : "",
    "## Özet",
    "",
    "| Metrik | Değer |",
    "|--------|-------|",
    `| Equsto Vosco ürün | ${report.summary.total} |`,
    `| Düzeltilen | **${report.summary.fixed}** |`,
    `| İskonto %45→%48 | ${report.summary.iskonto_fix} |`,
    `| Liste fiyatı düzeltme | ${report.summary.liste_fix} |`,
    `| Manuel TL | ${report.summary.manual} |`,
    `| Site fallback (PDF yok) | ${report.summary.site} |`,
    `| Fiyatsız | ${report.summary.no_price} |`,
    `| Hedef kaynak PDF | ${report.summary.target_pdf} |`,
    "",
    "## Teknik",
    "",
    "- `VOSCO_SATIS_ORAN = 0.48` (müşteri listenin %48'ini öder)",
    "- PDF USD/EUR → TCMB kur ile TL, ardından × 0.48 + KDV",
    "- PDF'de olmayan 12 ürün: vosco.com.tr site fiyatı veya manuel TL",
    "",
  ];

  if (report.fixed.length) {
    lines.push(
      "## Düzeltilen ürünler",
      "",
      "| Model | Tip | Eski TL | Yeni TL | Fark | Liste |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const r of report.fixed) {
      const diff = r.after_tl - r.before_tl;
      const pct = r.before_tl ? `${((diff / r.before_tl) * 100).toFixed(1)}%` : "—";
      const liste =
        r.pdf_usd > 0
          ? `$${r.pdf_usd}`
          : r.pdf_eur > 0
            ? `€${r.pdf_eur}`
            : r.after_kaynak;
      lines.push(
        `| ${r.model} | ${r.fix_tip} | ${fmtTl(r.before_tl)} | ${fmtTl(r.after_tl)} | ${diff >= 0 ? "+" : ""}${fmtTl(diff)} (${pct}) | ${liste} |`,
      );
    }
    lines.push("");
  }

  if (report.no_pdf.length) {
    lines.push("## PDF'de yok (site / manuel)", "", "| Model | Kaynak | TL |", "| --- | --- | --- |");
    for (const r of report.no_pdf) {
      lines.push(`| ${r.model} | ${r.kaynak} | ${r.fiyat_tl ? fmtTl(r.fiyat_tl) : "—"} |`);
    }
    lines.push("");
  }

  fs.writeFileSync(`${base}.md`, lines.join("\n"), "utf8");
  const csv = [
    "model;fix_tip;before_tl;after_tl;diff_tl;before_iskonto;after_iskonto;pdf_usd;pdf_eur;kaynak",
    ...report.fixed.map((r) =>
      [
        r.model,
        r.fix_tip,
        r.before_tl,
        r.after_tl,
        r.after_tl - r.before_tl,
        r.before_iskonto ?? "",
        VOSCO_ISKONTO_ORAN * 100,
        r.pdf_usd ?? "",
        r.pdf_eur ?? "",
        r.after_kaynak,
      ].join(";"),
    ),
  ].join("\n");
  fs.writeFileSync(`${base}.csv`, csv, "utf8");
  console.log(`→ ${base}.json / .md / .csv`);
}

async function main() {
  if (reextract) {
    console.log("[vosco-fix] PDF yeniden çıkarılıyor…");
    execFileSync("python", ["scripts/extract-vosco-pdf-catalog.py"], { cwd: ROOT, stdio: "inherit" });
  }

  if (!fs.existsSync(WEB)) {
    console.error("Önce: npm run catalog:vosco:scrape");
    process.exit(1);
  }

  const web = JSON.parse(await fsp.readFile(WEB, "utf8"));
  const webByCode = new Map((web.products || []).map((p) => [String(p.stockCode || "").toUpperCase(), p]));
  const pdfCatalog = loadVoscoPdfCatalog();
  const tcmb = await fetchTcmbEurUsdRates();
  const eurTry =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.eurTry;
  const usdTry =
    Number(process.env.EQUSTO_USD_TRY) > 0 ? Number(process.env.EQUSTO_USD_TRY) : tcmb.usdTry;

  const rows = await loadVoscoRows();
  const fixed = [];
  const noPdf = [];
  let targetPdf = 0;

  for (const row of rows) {
    const p = webByCode.get(String(row.model || "").toUpperCase());
    const target = p
      ? targetForWebProduct(p, usdTry, eurTry, pdfCatalog.index, pdfCatalog.products)
      : null;

    if (!target) {
      noPdf.push({ model: row.model, kaynak: row.kaynak_fiyat_listesi, fiyat_tl: row.fiyat_tl });
      continue;
    }
    if (target.kaynak === "vosco-pdf-2026") targetPdf++;

    const beforeIsk = row.iskonto_oran ?? row.satis_oran;
    let fixTip = "ok";
    if (target.kaynak === "vosco-manual-tl") fixTip = "manual_tl";
    else if (target.kaynak === "vosco-site-tl") fixTip = "site_tl";
    else if (Math.abs((beforeIsk ?? 55) - VOSCO_ISKONTO_ORAN * 100) > 0.5 || Math.abs((row.satis_oran ?? 0.45) - VOSCO_SATIS_ORAN) > 0.001) {
      fixTip = "iskonto_48";
    } else if (Math.abs((row.fiyat_tl || 0) - target.fiyat_tl) > 2) {
      fixTip = "fiyat";
    }

    const entry = {
      model: row.model,
      fix_tip: fixTip,
      before_tl: row.fiyat_tl,
      after_tl: target.fiyat_tl,
      before_iskonto: beforeIsk,
      before_kaynak: row.kaynak_fiyat_listesi,
      after_kaynak: target.kaynak,
      pdf_usd: target.liste_fiyati_usd_pdf || target.pdf_match?.listeUsd,
      pdf_eur: target.liste_fiyati_eur_pdf || target.pdf_match?.listeEur,
    };

    if (fixTip !== "ok" && (Math.abs((row.fiyat_tl || 0) - target.fiyat_tl) > 1 || fixTip === "iskonto_48")) {
      fixed.push(entry);
    }
    if (target.kaynak === "vosco-site-tl" || target.kaynak === "vosco-manual-tl") {
      noPdf.push({ model: row.model, kaynak: target.kaynak, fiyat_tl: target.fiyat_tl });
    }
  }

  const summary = {
    total: rows.length,
    fixed: fixed.length,
    iskonto_fix: fixed.filter((r) => r.fix_tip === "iskonto_48").length,
    liste_fix: fixed.filter((r) => r.fix_tip === "fiyat").length,
    manual: rows.filter((r) => r.kaynak_fiyat_listesi === "vosco-manual-tl").length,
    site: rows.filter((r) => r.kaynak_fiyat_listesi === "vosco-site-tl").length,
    no_price: rows.filter((r) => r.fiyat_bekleniyor).length,
    target_pdf: targetPdf,
  };

  console.log(
    `[vosco-fix] ${rows.length} ürün | düzeltilecek: ${fixed.length} | PDF: ${targetPdf} | iskonto %48`,
  );
  if (fixed.length) {
    console.log(
      "  örnek:",
      fixed
        .slice(0, 6)
        .map((r) => `${r.model} ${fmtTl(r.before_tl)}→${fmtTl(r.after_tl)}`)
        .join(" | "),
    );
  }

  if (!dryRun && fixed.length) {
    console.log("[vosco-fix] import-vosco-to-equsto çalıştırılıyor…");
    execFileSync(process.execPath, ["scripts/import-vosco-to-equsto.mjs"], { cwd: ROOT, stdio: "inherit" });
  }

  writeReports({
    generatedAt: new Date().toISOString(),
    pdfProducts: pdfCatalog.products.length,
    pdfIndexKeys: pdfCatalog.index.size,
    kur_usd_try: usdTry,
    kur_eur_try: eurTry,
    satis_oran: VOSCO_SATIS_ORAN,
    iskonto_oran: VOSCO_ISKONTO_ORAN,
    dryRun,
    summary,
    fixed: fixed.sort((a, b) => Math.abs(b.after_tl - b.before_tl) - Math.abs(a.after_tl - a.before_tl)),
    no_pdf: noPdf,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
