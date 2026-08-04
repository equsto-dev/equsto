#!/usr/bin/env node
/**
 * Mevcut Şenox (mutbex) satırlarına SENOX PDF liste fiyatı × %50 satış uygular.
 * Görseller ve slug'lar korunur.
 *
 *   node scripts/sync-senox-pdf-prices.mjs
 *   node scripts/sync-senox-pdf-prices.mjs --dry-run
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
import { MASTER_JSON_PATH } from "./catalog-master-paths.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const KAYNAK = "senox-mutbex";
const SATIS_ORAN = Number(process.env.EQUSTO_SENOX_SATIS_ORAN || "0.5");
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

function isSenoxRow(r) {
  const k = String(r?.kaynak_fiyat_listesi || r?.kaynak || "").toLowerCase();
  return k.includes("senox") || String(r?.id || "").startsWith("senox__");
}

function patchSpecsPriceBlock(specs, px, match, priceSource) {
  const lines = String(specs || "").split("\n");
  const start = lines.findIndex((l) =>
    /^Liste fiyatı \(EUR, (SENOX PDF|Mutbex liste)\):/i.test(l),
  );
  const listeLabel =
    priceSource === "senox-manual-tl"
      ? "Equsto satış (KDV dahil, manuel)"
      : priceSource === "senox-mutbex-liste"
      ? "Liste fiyatı (EUR, Mutbex liste)"
      : "Liste fiyatı (EUR, SENOX PDF)";
  const block = [
    priceSource === "senox-manual-tl"
      ? `Equsto satış (TL, KDV dahil): ₺${px.fiyat_tl.toLocaleString("tr-TR")}`
      : `${listeLabel}: ${px.liste_fiyati_eur}`,
    priceSource === "senox-manual-tl"
      ? `Gösterim eşdeğeri: liste × ${Math.round(SATIS_ORAN * 100)}% ≈ ${px.satis_fiyati_eur} EUR`
      : `Equsto satış: liste × ${Math.round(SATIS_ORAN * 100)}% = ${px.satis_fiyati_eur} EUR`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    match?.source === "mutbex" && match?.mutbexCode
      ? `Mutbex kod: ${match.mutbexCode} (satis ${match.satisEur} EUR × 2)`
      : match?.matchKey
        ? `PDF eşleşme: ${match.matchKey}${match.fuzzy ? " (yakın)" : ""}`
        : "",
  ].filter(Boolean);
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && !/^Kaynak fiyat:/i.test(lines[end])) end++;
    lines.splice(start, end - start, ...block);
    return lines.join("\n");
  }
  const kaynakIdx = lines.findIndex((l) => /^Kaynak fiyat:/i.test(l));
  if (kaynakIdx >= 0) {
    lines.splice(kaynakIdx, 0, "", ...block);
    return lines.join("\n");
  }
  return `${specs}\n\n${block.join("\n")}`;
}

function applyPrice(row, kur, pdfIndex, pdfProducts, mutbexIndex) {
  const productRef = {
    model: row.model,
    mutbexCode: row.sku || row.urun_kodu,
    sku: row.sku,
    urun_kodu: row.urun_kodu,
  };
  const manualMatch = findManualSenoxKdvDahil(productRef);
  if (manualMatch) {
    const px = pricingFromSenoxManualKdvDahil(manualMatch.kdvDahil, kur, KDV, SATIS_ORAN);
    const kaynakListe = "senox-manual-tl";
    const priceMatch = { matchKey: manualMatch.matchKey, source: "manual-tl" };
    const next = {
      ...row,
      ...px,
      iskonto_oran: Math.round(SATIS_ORAN * 100),
      kaynak_fiyat_listesi: kaynakListe,
      senox_pdf_match: manualMatch.matchKey,
      senox_pdf_fuzzy: false,
      senox_mutbex_match: "",
      equsto_site_markup: 0,
      equsto_kar_oran: 0,
      specs: patchSpecsPriceBlock(row.specs, px, priceMatch, kaynakListe),
    };
    const teknik = [...(row.teknik_ozellikler || [])].filter(
      (l) => !/^(PDF kod|Mutbex kod):/i.test(l),
    );
    teknik.push(`Manuel fiyat: ${manualMatch.matchKey}`);
    next.teknik_ozellikler = teknik;
    return { row: next, updated: true, priceMatch, kaynakListe };
  }
  const resolved = resolveSenoxListPrice(productRef, pdfIndex, pdfProducts, mutbexIndex);
  const priceMatch = resolved;
  const liste = priceMatch?.listeEur || 0;
  if (!(liste > 0)) return { row, updated: false, priceMatch };

  const px = pricingFromSenoxPdfListe(liste, kur, KDV, SATIS_ORAN);
  const kaynakListe =
    priceMatch?.source === "mutbex" && priceMatch?.rejectedPdf
      ? "senox-mutbex-liste"
      : priceMatch?.source === "mutbex"
        ? "senox-mutbex-liste"
        : "senox-pdf-2026-2-1";
  const pdfMatch =
    String(kaynakListe).includes("senox-pdf") ? priceMatch : priceMatch?.rejectedPdf || null;
  const mutbexMatch = priceMatch?.source === "mutbex" ? priceMatch : null;
  const next = {
    ...row,
    ...px,
    iskonto_oran: Math.round(SATIS_ORAN * 100),
    kaynak_fiyat_listesi: kaynakListe,
    senox_pdf_match: pdfMatch?.matchKey || "",
    senox_pdf_fuzzy: pdfMatch?.fuzzy || false,
    senox_mutbex_match: mutbexMatch?.mutbexCode || "",
    equsto_site_markup: 0,
    equsto_kar_oran: 0,
    specs: patchSpecsPriceBlock(row.specs, px, priceMatch, kaynakListe),
  };
  const teknik = [...(row.teknik_ozellikler || [])].filter(
    (l) => !/^(PDF kod|Mutbex kod):/i.test(l),
  );
  if (pdfMatch?.matchKey) teknik.push(`PDF kod: ${pdfMatch.matchKey}`);
  if (mutbexMatch?.mutbexCode) teknik.push(`Mutbex kod: ${mutbexMatch.mutbexCode}`);
  next.teknik_ozellikler = teknik;
  return { row: next, updated: true, priceMatch, kaynakListe };
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

/** dept Şenox satırları → equsto-katalog-master.json (PFOS arama) */
function syncSenoxRowsToMaster(senoxById) {
  if (!fs.existsSync(MASTER_JSON_PATH) || senoxById.size === 0) return 0;
  const master = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, "utf8"));
  const products = master.products || [];
  let patched = 0;
  for (const p of products) {
    if (!p?.id?.startsWith("senox__")) continue;
    const row = senoxById.get(p.id);
    if (!row) continue;
    if (row.liste_fiyati_eur > 0) p.fiyat_eur = row.liste_fiyati_eur;
    if (row.fiyat_tl > 0) p.fiyat_tl = row.fiyat_tl;
    if (row.specs) p.teknik_ozellikler = row.specs;
    patched++;
  }
  if (patched) {
    master.generated = new Date().toISOString();
    writeJsonAtomic(MASTER_JSON_PATH, master);
  }
  return patched;
}

async function main() {
  const pdfCatalog = loadSenoxPdfCatalog();
  const pdfIndex = pdfCatalog.index;
  const mutbexCatalog = loadMutbexCatalog();
  const mutbexIndex = mutbexCatalog.index;
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  let total = 0;
  let updated = 0;
  let fromPdf = 0;
  let fromMutbex = 0;
  let stillMissing = 0;
  const missing = [];
  const senoxById = new Map();

  for (const file of (await fsp.readdir(DEPT_DIR)).sort()) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(DEPT_DIR, file);
    const rows = JSON.parse(await fsp.readFile(filePath, "utf8"));
    if (!Array.isArray(rows)) continue;

    let fileUpdated = 0;
    const nextRows = rows.map((row) => {
      if (!isSenoxRow(row)) return row;
      total++;
      const { row: patched, updated: ok, kaynakListe } = applyPrice(
        row,
        kur,
        pdfIndex,
        pdfCatalog.products,
        mutbexIndex,
      );
      if (ok) {
        updated++;
        fileUpdated++;
        if (kaynakListe === "senox-mutbex-liste") fromMutbex++;
        else fromPdf++;
        senoxById.set(patched.id, patched);
        return patched;
      }
      if (patched.id) senoxById.set(patched.id, patched);
      stillMissing++;
      missing.push({ model: row.model, sku: row.sku, name: row.name });
      return row;
    });

    if (fileUpdated && !dryRun) writeJsonAtomic(filePath, nextRows);
  }

  console.log(`[senox-pdf-prices] PDF: ${pdfCatalog.liste} | Mutbex: ${mutbexCatalog.products.length} ürün | kur: ${kur}`);
  console.log(
    `  senox satır: ${total} | güncellendi: ${updated} (PDF: ${fromPdf}, Mutbex: ${fromMutbex}) | hâlâ eşleşmeyen: ${stillMissing}`,
  );
  if (missing.length) {
    console.log("  eşleşmeyen örnek:", missing.slice(0, 12).map((m) => m.model || m.sku).join(", "));
  }

  if (!dryRun && updated) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  if (!dryRun) {
    const masterPatched = syncSenoxRowsToMaster(senoxById);
    if (masterPatched) {
      console.log(`  master katalog: ${masterPatched} Şenox satırı güncellendi`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
