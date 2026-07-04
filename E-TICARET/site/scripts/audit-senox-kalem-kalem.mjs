#!/usr/bin/env node
/**
 * Şenox — 214 ürün kalem kalem denetim (PDF × Mutbex × site × formül)
 *
 *   node scripts/audit-senox-kalem-kalem.mjs
 *   node scripts/audit-senox-kalem-kalem.mjs --csv
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  extractAnchoredPriceFromDescription,
  findManualSenoxKdvDahil,
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
  normSenoxKey,
  pricingFromSenoxPdfListe,
  resolveSenoxListPrice,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const OUT_JSON = path.join(ROOT, "scripts/data/senox/kalem-kalem-audit.json");
const OUT_MD = path.join(ROOT, "scripts/data/senox/kalem-kalem-audit.md");
const OUT_CSV = path.join(ROOT, "scripts/data/senox/kalem-kalem-audit.csv");
const SATIS = 0.5;
const KDV = 20;
const TOL = 2;

function isSenoxRow(r) {
  const k = String(r?.kaynak_fiyat_listesi || r?.kaynak || "").toLowerCase();
  return k.includes("senox") || String(r?.id || "").startsWith("senox__");
}

function pctDiff(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.round((Math.abs(a - b) / Math.max(a, b)) * 1000) / 10;
}

function classify(row) {
  const tags = [];
  if (row.formula_ok) tags.push("ok");
  else tags.push("formul_hata");
  if (row.pdf_page_order) tags.push("pdf_page_order");
  if (row.desc_vs_specs) tags.push("desc_specs_fark");
  if (row.pdf_mut_pct != null && row.pdf_mut_pct > 15) tags.push("pdf_mut_catisma");
  if (row.pdf_mut_pct != null && row.pdf_liste < row.mut_liste * 0.85) tags.push("pdf_dusuk");
  if (row.pdf_mut_pct != null && row.pdf_liste > row.mut_liste * 1.5) tags.push("pdf_yuksek");
  if (!row.pdf_liste && row.mut_liste) tags.push("mutbex_only");
  if (row.pdf_liste && !row.mut_liste) tags.push("pdf_only");
  if (row.oneri_liste && row.oneri_liste !== row.site_liste && !row.manual_tl) tags.push("guncelleme_oner");
  return tags;
}

async function loadSiteSenox() {
  const rows = [];
  for (const f of (await fsp.readdir(DEPT)).sort()) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(await fsp.readFile(path.join(DEPT, f), "utf8"));
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (!isSenoxRow(r)) continue;
      rows.push({ ...r, dept_file: f });
    }
  }
  return rows;
}

function pdfMetaByKey(products) {
  const map = new Map();
  for (const p of products) {
    const k = normSenoxKey(p.model);
    if (k) map.set(k, p);
  }
  return map;
}

async function main() {
  const kur = (await fetchTcmbEurRate()).rate;
  const pdf = loadSenoxPdfCatalog();
  const mut = loadMutbexCatalog();
  const pdfMeta = pdfMetaByKey(pdf.products);
  const siteRows = await loadSiteSenox();

  const items = [];
  for (const r of siteRows) {
    const ref = {
      model: r.model,
      mutbexCode: r.sku || r.urun_kodu,
      sku: r.sku,
      urun_kodu: r.urun_kodu,
    };
    const pdfDirect = findPdfListPrice(ref, pdf.index, pdf.products);
    const mutDirect = findMutbexListPrice(ref, mut.index);
    const resolved = resolveSenoxListPrice(ref, pdf.index, pdf.products, mut.index);
    const meta = pdfMeta.get(normSenoxKey(r.model));
    const specsListe = meta ? Number(meta.specs?.fiyat_eur) || 0 : 0;
    const descListe = meta
      ? extractAnchoredPriceFromDescription(meta.description, meta.model, meta.title, r.name)
      : 0;
    const allDescEur = meta
      ? [...String(meta.description || "").matchAll(/(\d+(?:\.\d{3})*)\s*EUR/gi)].map((m) =>
          Number(m[1].replace(/\./g, "")),
        )
      : [];

    const siteListe = Number(r.liste_fiyati_eur) || 0;
    const siteTl = Number(r.fiyat_tl) || 0;
    const manual = findManualSenoxKdvDahil(ref);
    const oneriListe = resolved?.listeEur || 0;
    const oneriPx = manual
      ? { fiyat_tl: manual.kdvDahil }
      : oneriListe > 0
        ? pricingFromSenoxPdfListe(oneriListe, kur, KDV, SATIS)
        : null;
    const expectedTl = oneriPx?.fiyat_tl || 0;

    const pdfListe = pdfDirect?.listeEur ?? null;
    const mutListe = mutDirect?.listeEur ?? null;

    items.push({
      sira: items.length + 1,
      model: r.model,
      sku: r.sku,
      name: String(r.name || "").slice(0, 70),
      dept: r.dept || r.dept_file?.replace(".json", ""),
      site_kaynak: r.kaynak_fiyat_listesi || r.kaynak || "",
      manual_tl: !!manual,
      site_liste: siteListe,
      site_tl: siteTl,
      pdf_liste: pdfListe,
      pdf_key: pdfDirect?.matchKey || "",
      pdf_source: pdfDirect?.source || "",
      pdf_page_order: meta?.specs?.fiyat_eur_source === "page-order",
      pdf_page: meta?.page ?? null,
      mut_liste: mutListe,
      desc_liste: descListe || null,
      desc_all_eur: allDescEur.length ? [...new Set(allDescEur)] : [],
      specs_liste: specsListe || null,
      desc_vs_specs:
        descListe > 0 && specsListe > 0 && Math.abs(descListe - specsListe) > 1,
      oneri_liste: oneriListe,
      oneri_tl: expectedTl,
      oneri_kaynak: resolved?.source || "",
      pdf_mut_pct: pctDiff(pdfListe, mutListe),
      formula_ok: expectedTl > 0 && Math.abs(siteTl - expectedTl) <= TOL,
      tl_fark: siteTl - expectedTl,
      durum: "",
    });
  }

  for (const it of items) {
    it.durum = classify(it).join(", ");
  }

  const summary = {
    total: items.length,
    formula_ok: items.filter((i) => i.formula_ok).length,
    formula_bad: items.filter((i) => !i.formula_ok).length,
    guncelleme_oner: items.filter((i) => i.durum.includes("guncelleme_oner")).length,
    pdf_page_order: items.filter((i) => i.pdf_page_order).length,
    desc_specs_fark: items.filter((i) => i.desc_vs_specs).length,
    pdf_mut_catisma: items.filter((i) => i.durum.includes("pdf_mut_catisma")).length,
    pdf_dusuk: items.filter((i) => i.durum.includes("pdf_dusuk")).length,
    mutbex_only: items.filter((i) => i.durum.includes("mutbex_only")).length,
    pdf_only: items.filter((i) => i.durum.includes("pdf_only")).length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    kur,
    formula: "liste × 0,50 × kur × 1,20 KDV → fiyat_tl",
    pdfProducts: pdf.products.length,
    summary,
    items,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# Şenox kalem kalem fiyat denetimi",
    "",
    `**Tarih:** ${report.generatedAt}`,
    `**Kur:** 1 EUR = ${kur} TRY`,
    `**Formül:** ${report.formula}`,
    "",
    "## Özet",
    "",
    "| Metrik | Adet |",
    "|--------|------|",
    `| Sitede Şenox | ${summary.total} |`,
    `| Formül uyumlu | ${summary.formula_ok} |`,
    `| Formül sapması | ${summary.formula_bad} |`,
    `| Güncelleme önerilen | ${summary.guncelleme_oner} |`,
    `| PDF page-order (şüpheli) | ${summary.pdf_page_order} |`,
    `| Description ≠ specs fiyat | ${summary.desc_specs_fark} |`,
    `| PDF ≠ Mutbex (>15%) | ${summary.pdf_mut_catisma} |`,
    `| PDF düşük (Mutbex'ten) | ${summary.pdf_dusuk} |`,
    `| Yalnız Mutbex | ${summary.mutbex_only} |`,
    `| Yalnız PDF | ${summary.pdf_only} |`,
    "",
    "## Güncelleme önerilen (site ≠ öneri)",
    "",
    "| Model | SKU | Sitede ₺ | Öneri ₺ | Fark | Site liste € | Öneri € | PDF € | Mut € | Durum |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  const needsFix = items
    .filter((i) => !i.formula_ok || (i.durum.includes("guncelleme_oner") && !i.manual_tl))
    .sort((a, b) => Math.abs(b.tl_fark) - Math.abs(a.tl_fark));

  for (const r of needsFix) {
    md.push(
      `| ${r.model} | ${r.sku || ""} | ${r.site_tl.toLocaleString("tr-TR")} | ${r.oneri_tl.toLocaleString("tr-TR")} | ${r.tl_fark >= 0 ? "+" : ""}${r.tl_fark.toLocaleString("tr-TR")} | ${r.site_liste || "—"} | ${r.oneri_liste || "—"} | ${r.pdf_liste ?? "—"} | ${r.mut_liste ?? "—"} | ${r.durum} |`,
    );
  }

  md.push("", "## PDF description ≠ specs (parser hatası adayı)", "");
  const descBad = items.filter((i) => i.desc_vs_specs);
  if (descBad.length) {
    md.push("| Model | specs € | desc € | desc tüm EUR | page |", "| --- | --- | --- | --- | --- |");
    for (const r of descBad.slice(0, 40)) {
      md.push(
        `| ${r.model} | ${r.specs_liste} | ${r.desc_liste} | ${(r.desc_all_eur || []).join(", ")} | ${r.pdf_page ?? "—"} |`,
      );
    }
    if (descBad.length > 40) md.push(`| … | | | +${descBad.length - 40} ürün | |`);
  } else {
    md.push("_Yok._");
  }

  md.push("", "## PDF page-order kaynaklı (manuel kontrol)", "");
  const po = items.filter((i) => i.pdf_page_order);
  md.push(`_${po.length} ürün — sayfa EUR sırasıyla atanmış, komşu ürün fiyatı riski._`, "");
  if (po.length) {
    md.push("| Model | SKU | PDF € | Mut € | Site ₺ |", "| --- | --- | --- | --- | --- |");
    for (const r of po.slice(0, 35)) {
      md.push(
        `| ${r.model} | ${r.sku || ""} | ${r.pdf_liste ?? "—"} | ${r.mut_liste ?? "—"} | ${r.site_tl.toLocaleString("tr-TR")} |`,
      );
    }
    if (po.length > 35) md.push(`| … | | | | +${po.length - 35} |`);
  }

  fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

  const csvLines = [
    "sira;model;sku;site_tl;oneri_tl;tl_fark;site_liste_eur;oneri_liste_eur;pdf_liste_eur;mut_liste_eur;pdf_page_order;desc_vs_specs;durum",
    ...items.map((r) =>
      [
        r.sira,
        r.model,
        r.sku || "",
        r.site_tl,
        r.oneri_tl,
        r.tl_fark,
        r.site_liste || "",
        r.oneri_liste || "",
        r.pdf_liste ?? "",
        r.mut_liste ?? "",
        r.pdf_page_order ? 1 : 0,
        r.desc_vs_specs ? 1 : 0,
        r.durum,
      ].join(";"),
    ),
  ];
  fs.writeFileSync(OUT_CSV, csvLines.join("\n"), "utf8");

  console.log("=== Şenox kalem kalem denetim ===");
  console.log(`Kur: ${kur} | Ürün: ${summary.total}`);
  console.log(`Formül OK: ${summary.formula_ok} | Sapma: ${summary.formula_bad}`);
  console.log(`Güncelleme öneri: ${needsFix.length} | page-order: ${summary.pdf_page_order} | desc≠specs: ${summary.desc_specs_fark}`);
  console.log(`→ ${OUT_JSON}`);
  console.log(`→ ${OUT_MD}`);
  console.log(`→ ${OUT_CSV}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
