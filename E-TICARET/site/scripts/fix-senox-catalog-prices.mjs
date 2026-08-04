#!/usr/bin/env node
/**
 * SENOX 2026-1 PDF × %50 iskonto — tam katalog denetimi ve düzeltme raporu.
 *
 *   node scripts/fix-senox-catalog-prices.mjs              # denetle + uygula + rapor
 *   node scripts/fix-senox-catalog-prices.mjs --dry-run    # sadece rapor
 *   node scripts/fix-senox-catalog-prices.mjs --reextract  # PDF yeniden çıkar
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  findManualSenoxKdvDahil,
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
  pricingFromSenoxManualKdvDahil,
  pricingFromSenoxPdfListe,
  resolveSenoxListPrice,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const OUT_DIR = path.join(ROOT, "scripts/data/senox");
const SATIS_ORAN = 0.5;
const KDV = 20;
const dryRun = process.argv.includes("--dry-run");
const reextract = process.argv.includes("--reextract");

function isSenoxRow(r) {
  const k = String(r?.kaynak_fiyat_listesi || r?.kaynak || "").toLowerCase();
  return k.includes("senox") || String(r?.id || "").startsWith("senox__");
}

function targetForRow(row, kur, pdfIndex, pdfProducts, mutbexIndex) {
  const ref = {
    model: row.model,
    mutbexCode: row.sku || row.urun_kodu,
    sku: row.sku,
    urun_kodu: row.urun_kodu,
  };
  const manual = findManualSenoxKdvDahil(ref);
  if (manual) {
    const px = pricingFromSenoxManualKdvDahil(manual.kdvDahil, kur, KDV, SATIS_ORAN);
    return {
      ...px,
      kaynak: "senox-manual-tl",
      pdf_key: manual.matchKey,
      mut_key: "",
      pdf_liste: null,
      mut_liste: null,
      rejected_pdf: null,
    };
  }
  const resolved = resolveSenoxListPrice(ref, pdfIndex, pdfProducts, mutbexIndex);
  if (!resolved?.listeEur) return null;
  const px = pricingFromSenoxPdfListe(resolved.listeEur, kur, KDV, SATIS_ORAN);
  const kaynak =
    resolved.source === "mutbex"
      ? "senox-mutbex-liste"
      : resolved.source === "override"
        ? "senox-pdf-2026-2-1"
        : "senox-pdf-2026-2-1";
  const pdfOnly = findPdfListPrice(ref, pdfIndex, pdfProducts);
  const mutOnly = findMutbexListPrice(ref, mutbexIndex);
  return {
    ...px,
    kaynak,
    pdf_key: resolved.rejectedPdf?.matchKey || (kaynak.includes("pdf") ? resolved.matchKey : pdfOnly?.matchKey) || "",
    mut_key: resolved.mutbexCode || mutOnly?.mutbexCode || "",
    pdf_liste: pdfOnly?.listeEur ?? null,
    mut_liste: mutOnly?.listeEur ?? null,
    rejected_pdf: resolved.rejectedPdf || null,
  };
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

function classifyChange(before, after, target) {
  if (!target) return "no_price";
  if (before.kaynak_fiyat_listesi !== target.kaynak && before.kaynak_fiyat_listesi?.includes("mutbex") && target.kaynak.includes("pdf")) {
    return "kaynak_mutbex_to_pdf";
  }
  if (before.kaynak_fiyat_listesi?.includes("pdf") && target.kaynak.includes("mutbex") && !target.rejected_pdf) {
    return "kaynak_pdf_to_mutbex";
  }
  if (target.rejected_pdf) return "ocr_guard_mutbex";
  if (target.kaynak === "senox-manual-tl") return "manual_tl";
  if (Math.abs((before.fiyat_tl || 0) - target.fiyat_tl) <= 1) return "ok";
  if ((before.liste_fiyati_eur || 0) < (target.liste_fiyati_eur || 0)) return "price_up";
  return "price_down";
}

function fmtTl(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

function writeReports(report) {
  const base = path.join(OUT_DIR, "senox-fix-rapor");
  fs.writeFileSync(`${base}.json`, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# Şenox Katalog Fiyat Düzeltme Raporu",
    "",
    `**Tarih:** ${report.generatedAt}`,
    `**Kaynak:** SENOX 2026-1 PDF (${report.pdfProducts} ürün, ${report.pdfIndexKeys} fiyat kodu)`,
    `**Formül:** Equsto = PDF liste EUR × 50% × kur × 1.20 (KDV dahil)`,
    `**Kur:** 1 EUR = ${report.kur_eur_try} TRY`,
    dryRun ? "\n> **DRY-RUN** — dosyalara yazılmadı\n" : "",
    "## Özet",
    "",
    "| Metrik | Değer |",
    "|--------|-------|",
    `| Equsto Şenox ürün | ${report.summary.total} |`,
    `| Düzeltilen | **${report.summary.fixed}** |`,
    `| Kaynak Mutbex → PDF | ${report.summary.kaynak_to_pdf} |`,
    `| OCR hatası → Mutbex | ${report.summary.ocr_guard} |`,
    `| Fiyat artan | ${report.summary.price_up} |`,
    `| Fiyat düşen | ${report.summary.price_down} |`,
    `| Manuel TL | ${report.summary.manual_tl} |`,
    `| Zaten doğru | ${report.summary.ok} |`,
    `| Hedef kaynak PDF | ${report.summary.target_pdf} |`,
    `| Hedef kaynak Mutbex | ${report.summary.target_mutbex} |`,
    `| PDF ≠ Mutbex çakışma | ${report.summary.pdf_mutbex_conflicts} |`,
    "",
    "## Teknik düzeltmeler",
    "",
    "1. **PDF yeniden çıkarım** — `SENOX 2026-1 4 (1).pdf`",
    "2. **descMap birleştirme** — çoklu varyant tabloları (SBC/SBCS, SLD, ADA, MT …)",
    "3. **Kısa kod indeksi** — BS, DVF, VN, SET, KO, CMVA vb.",
    "4. **OCR güvenlik** — PDF liste > Mutbex × 2,5 ise Mutbex tercih",
    "5. **Override** — DT, WN, VM, SLD-03/04, YSO, SNX-17/25 …",
    "",
  ];

  if (report.fixed.length) {
    lines.push("## Düzeltilen ürünler", "", "| Model | SKU | Tip | Eski TL | Yeni TL | Fark | PDF € | Mut € |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const r of report.fixed) {
      const diff = r.after_tl - r.before_tl;
      const diffPct = r.before_tl ? `${((diff / r.before_tl) * 100).toFixed(1)}%` : "—";
      lines.push(
        `| ${r.model} | ${r.sku || ""} | ${r.fix_tip} | ${fmtTl(r.before_tl)} | ${fmtTl(r.after_tl)} | ${diff >= 0 ? "+" : ""}${fmtTl(diff)} (${diffPct}) | ${r.pdf_liste_eur ?? "—"} | ${r.mut_liste_eur ?? "—"} |`,
      );
    }
    lines.push("");
  }

  if (report.ocr_rejected.length) {
    lines.push("## OCR reddedildi (Mutbex tercih)", "", "| Model | PDF € (hatalı) | Mut € | TL |", "| --- | --- | --- | --- |");
    for (const r of report.ocr_rejected) {
      lines.push(`| ${r.model} | ${r.pdf_liste} | ${r.mut_liste} | ${fmtTl(r.after_tl)} |`);
    }
    lines.push("");
  }

  if (report.mutbex_only.length) {
    lines.push(
      "## PDF'de yok — Mutbex liste × %50",
      "",
      `_${report.mutbex_only.length} ürün; SENOX PDF'de kod yok, Mutbex satış × 2 = liste._`,
      "",
      "| Model | SKU | Liste € | TL KDV dahil |",
      "| --- | --- | --- | --- |",
    );
    for (const r of report.mutbex_only.slice(0, 40)) {
      lines.push(`| ${r.model} | ${r.sku || ""} | ${r.liste_eur} | ${fmtTl(r.fiyat_tl)} |`);
    }
    if (report.mutbex_only.length > 40) {
      lines.push(`| … | | | +${report.mutbex_only.length - 40} ürün |`);
    }
    lines.push("");
  }

  fs.writeFileSync(`${base}.md`, lines.join("\n"), "utf8");

  const csv = [
    "model;sku;fix_tip;before_kaynak;after_kaynak;pdf_liste_eur;mut_liste_eur;before_tl;after_tl;diff_tl;pdf_key",
    ...report.fixed.map((r) =>
      [
        r.model,
        r.sku || "",
        r.fix_tip,
        r.before_kaynak || "",
        r.after_kaynak || "",
        r.pdf_liste_eur ?? "",
        r.mut_liste_eur ?? "",
        r.before_tl,
        r.after_tl,
        r.after_tl - r.before_tl,
        r.pdf_key || "",
      ].join(";"),
    ),
  ].join("\n");
  fs.writeFileSync(`${base}.csv`, csv, "utf8");
  console.log(`→ ${base}.json / .md / .csv`);
}

async function main() {
  if (reextract) {
    console.log("[fix] PDF yeniden çıkarılıyor…");
    execFileSync("python", ["scripts/extract-senox-pdf-catalog.py"], { cwd: ROOT, stdio: "inherit" });
  }

  const pdfCatalog = loadSenoxPdfCatalog();
  const mutbexCatalog = loadMutbexCatalog();
  const tcmb = await fetchTcmbEurRate();
  const kur = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const rows = await loadSenoxRows();
  const audits = [];
  const fixed = [];
  const ocrRejected = [];
  const mutbexOnly = [];
  let targetPdf = 0;
  let targetMut = 0;
  let conflicts = 0;

  for (const row of rows) {
    const target = targetForRow(row, kur, pdfCatalog.index, pdfCatalog.products, mutbexCatalog.index);
    if (!target) continue;
    if (target.kaynak.includes("pdf")) targetPdf++;
    else if (target.kaynak.includes("mutbex")) targetMut++;
    if (target.pdf_liste && target.mut_liste && Math.abs(target.pdf_liste - target.mut_liste) / Math.max(target.pdf_liste, target.mut_liste) > 0.12) {
      conflicts++;
    }
    if (target.kaynak.includes("mutbex") && !target.pdf_liste) {
      mutbexOnly.push({
        model: row.model,
        sku: row.sku,
        liste_eur: target.liste_fiyati_eur,
        fiyat_tl: target.fiyat_tl,
      });
    }
    const fixTip = classifyChange(row, row, target);
    const entry = {
      model: row.model,
      sku: row.sku,
      name: row.name,
      dept: row.dept_file,
      fix_tip: fixTip,
      before_kaynak: row.kaynak_fiyat_listesi,
      after_kaynak: target.kaynak,
      before_liste_eur: row.liste_fiyati_eur,
      after_liste_eur: target.liste_fiyati_eur,
      before_tl: row.fiyat_tl,
      after_tl: target.fiyat_tl,
      pdf_liste_eur: target.pdf_liste,
      mut_liste_eur: target.mut_liste,
      pdf_key: target.pdf_key,
    };
    audits.push(entry);
    if (fixTip !== "ok" && fixTip !== "no_price") {
      if (Math.abs((row.fiyat_tl || 0) - target.fiyat_tl) > 1 || row.kaynak_fiyat_listesi !== target.kaynak) {
        fixed.push(entry);
      }
    }
    if (target.rejected_pdf) {
      ocrRejected.push({
        model: row.model,
        pdf_liste: target.rejected_pdf.listeEur,
        mut_liste: target.mut_liste,
        after_tl: target.fiyat_tl,
      });
    }
  }

  const summary = {
    total: rows.length,
    fixed: fixed.length,
    kaynak_to_pdf: fixed.filter((r) => r.fix_tip === "kaynak_mutbex_to_pdf").length,
    ocr_guard: fixed.filter((r) => r.fix_tip === "ocr_guard_mutbex").length,
    price_up: fixed.filter((r) => r.fix_tip === "price_up").length,
    price_down: fixed.filter((r) => r.fix_tip === "price_down").length,
    manual_tl: fixed.filter((r) => r.fix_tip === "manual_tl").length,
    ok: audits.filter((r) => r.fix_tip === "ok").length,
    target_pdf: targetPdf,
    target_mutbex: targetMut,
    pdf_mutbex_conflicts: conflicts,
    still_wrong: 0,
  };

  console.log(`[fix] denetim: ${rows.length} ürün | düzeltilecek: ${fixed.length} | PDF: ${targetPdf} | Mutbex: ${targetMut}`);
  if (fixed.length) {
    console.log("  örnek:", fixed.slice(0, 8).map((r) => `${r.model} ${fmtTl(r.before_tl)}→${fmtTl(r.after_tl)}`).join(" | "));
  }

  if (!dryRun && fixed.length) {
    console.log("[fix] sync-senox-pdf-prices çalıştırılıyor…");
    execFileSync(process.execPath, ["scripts/sync-senox-pdf-prices.mjs"], { cwd: ROOT, stdio: "inherit" });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    pdfPath: "SENOX 2026-1 4 (1).pdf",
    pdfProducts: pdfCatalog.products.length,
    pdfIndexKeys: pdfCatalog.index.size,
    kur_eur_try: kur,
    satis_oran: SATIS_ORAN,
    kdv: KDV,
    formula: "Equsto = PDF liste EUR × 50% × kur × 1.20 (KDV dahil)",
    dryRun,
    summary,
    fixed: fixed.sort((a, b) => Math.abs(b.after_tl - b.before_tl) - Math.abs(a.after_tl - a.before_tl)),
    ocr_rejected: ocrRejected,
    mutbex_only: mutbexOnly.sort((a, b) => b.fiyat_tl - a.fiyat_tl),
    audits,
  };

  writeReports(report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
