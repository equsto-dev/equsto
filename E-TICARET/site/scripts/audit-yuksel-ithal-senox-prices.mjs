#!/usr/bin/env node
/**
 * YÜKSEL İTHAL 2025 + SENOX 2026-1 fiyat denetimi
 * Formül: liste × (1−iskonto) × 1,10 kar × kur × 1,20 KDV → fiyat_tl (KDV dahil)
 *
 *   node scripts/audit-yuksel-ithal-senox-prices.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  findManualSenoxKdvDahil,
  findMutbexListPrice,
  findPdfListPrice,
  loadMutbexCatalog,
  loadSenoxPdfCatalog,
  normSenoxKey,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = path.join(ROOT, "var/catalog/ekipmanlar.json");
const YUKSEL_ITHAL = [
  path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-ithal/tum-urunler.json"),
  path.join(ROOT, "..", "..", "EQUSTO-WORK/public/data/fiyat-listeleri/yuksel/2025-ithal/tum-urunler.json"),
].find((p) => fs.existsSync(p));

const KDV = 20;
const KAR = 0.1;
const YUKSEL_ISK = 0.45;
const SENOX_ISK = 0.55;
const TOL = 2;

const SKU_TO_YUKSEL_REF = {
  "9860.MP160.VV": "34740",
  "9860.MP190.VV": "34750",
  "9860.MP190.C0": "34770",
  "9860.MP240.VV": "34760",
  "9860.MP250.C0": "34300B",
  "9810.MP350.U0": "34800L",
  "9810.MP350.CU": "34860L",
  "9810.MP450.UL": "34810L",
  "9860.MP450.C0": "34870L",
  "9860.MP550.A0": "34820LH",
  "9860.MP600.A0": "34830LH",
  "9810.MP800.UL": "34890L",
  "9840.CL50D.00": "24440",
  "9840.CL52D.00": "24490",
  "9840.CL55D.00": "2245",
  "9840.CL60D.00": "2325F",
  "9840.R201E.00": "2129D",
  "9840.R301C.00": "2525",
  "9860.000R2.00": "22100D",
  "9860.000R5.00": "24608M",
  "9860.00J80.00": "56000B",
};

const MANUAL_LISTE_EUR = { "34820LH": 1223.3, "34830LH": 1533.0 };

function fmt(n) {
  return Math.round(n).toLocaleString("tr-TR");
}

function normRef(s) {
  return String(s || "").toUpperCase().replace(/\s+/g, "");
}

function priceFromListe(listeEur, kur, iskonto) {
  const alisEur = Math.round(listeEur * (1 - iskonto) * 100) / 100;
  const satisEur = Math.round(alisEur * (1 + KAR) * 100) / 100;
  const netTry = satisEur * kur;
  const kdvDahil = Math.round(netTry * (1 + KDV / 100));
  return { listeEur, alisEur, satisEur, kdvDahil, kur };
}

function isSenoxRow(r) {
  const k = String(r.kaynak_fiyat_listesi || r.kaynak || "").toLowerCase();
  const id = String(r.id || "");
  return (
    k.includes("senox") ||
    id.startsWith("senox__") ||
    /^senox$/i.test(String(r.brand || "").trim())
  );
}

function isYukselIthalRow(r) {
  return String(r.kaynak_fiyat_listesi || r.kaynak || "").includes("yuksel-2025-ithal");
}

async function auditYukselIthal(catalog, kur) {
  if (!YUKSEL_ITHAL) {
    return { error: "YÜKSEL İTHAL JSON yok — önce PDF import", rows: [] };
  }
  const pdf = JSON.parse(fs.readFileSync(YUKSEL_ITHAL, "utf8"));
  const byRef = new Map(pdf.map((r) => [normRef(r.sku || r.model), r]));

  const rows = [];
  for (const p of catalog) {
    if (!isYukselIthalRow(p) && !SKU_TO_YUKSEL_REF[p.sku]) continue;
    const sku = String(p.sku || "").trim();
    const yRef = SKU_TO_YUKSEL_REF[sku];
    if (!yRef) continue;
    const src = byRef.get(normRef(yRef));
    let liste = src ? Number(src.fiyat_euro) : NaN;
    if (!(liste > 0) && MANUAL_LISTE_EUR[yRef]) liste = MANUAL_LISTE_EUR[yRef];
    if (!(liste > 0)) {
      rows.push({ sku, name: p.name, status: "pdf-yok", yRef });
      continue;
    }
    const exp = priceFromListe(liste, kur, YUKSEL_ISK);
    const cur = Number(p.fiyat_tl) || 0;
    const diff = cur - exp.kdvDahil;
    const pct = cur > 0 ? ((diff / cur) * 100).toFixed(1) : "—";
    rows.push({
      sku,
      name: String(p.name || "").slice(0, 55),
      yRef,
      listeEur: liste,
      cur,
      expected: exp.kdvDahil,
      diff,
      pct,
      ok: Math.abs(diff) <= TOL,
      alisEur: exp.alisEur,
      satisEur: exp.satisEur,
    });
  }
  return { rows, pdfCount: pdf.length };
}

async function auditSenox(catalog, kur) {
  const pdfCat = loadSenoxPdfCatalog();
  const mutbex = loadMutbexCatalog();
  const pdfIndex = pdfCat.index;
  const mutbexIndex = mutbex.index;

  const rows = [];
  for (const p of catalog) {
    if (!isSenoxRow(p)) continue;
    const manual = findManualSenoxKdvDahil(p);
    if (manual) {
      const cur = Number(p.fiyat_tl) || 0;
      rows.push({
        sku: p.sku || p.model,
        name: String(p.name || "").slice(0, 55),
        listeEur: null,
        cur,
        expected: manual.kdvDahil,
        diff: cur - manual.kdvDahil,
        ok: Math.abs(cur - manual.kdvDahil) <= TOL,
        note: "manuel KDV dahil sabit",
        match: manual.matchKey,
      });
      continue;
    }

    const productRef = {
      model: p.model,
      mutbexCode: p.sku || p.urun_kodu,
      sku: p.sku,
      name: p.name,
      title: p.name,
    };
    let listeEur = Number(p.liste_fiyati_eur) || 0;
    let matchSrc = listeEur > 0 ? "katalog-liste" : null;

    if (!(listeEur > 0)) {
      let match = findPdfListPrice(productRef, pdfIndex, pdfCat.products);
      if (!match?.listeEur) match = findMutbexListPrice(productRef, mutbexIndex);
      if (match?.listeEur) {
        listeEur = match.listeEur;
        matchSrc = match.matchKey || match.source;
      }
    }

    if (!(listeEur > 0)) {
      rows.push({
        sku: p.sku,
        name: String(p.name || "").slice(0, 55),
        status: "liste-yok",
      });
      continue;
    }

    const exp = priceFromListe(listeEur, kur, SENOX_ISK);
    const cur = Number(p.fiyat_tl) || 0;
    const diff = cur - exp.kdvDahil;
    rows.push({
      sku: p.sku || p.model,
      name: String(p.name || "").slice(0, 55),
      listeEur,
      cur,
      expected: exp.kdvDahil,
      diff,
      pct: cur > 0 ? ((diff / cur) * 100).toFixed(1) : "—",
      ok: Math.abs(diff) <= TOL,
      alisEur: exp.alisEur,
      satisEur: exp.satisEur,
      match: matchSrc,
      kaynak: p.kaynak_fiyat_listesi,
    });
  }
  return { rows, pdfCount: pdfCat.products?.length || 0 };
}

function summarize(label, rows) {
  const priced = rows.filter((r) => r.expected != null);
  const ok = priced.filter((r) => r.ok);
  const bad = priced.filter((r) => !r.ok);
  const missing = rows.filter((r) => r.status);
  bad.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return { label, total: rows.length, priced: priced.length, ok: ok.length, bad, missing };
}

async function main() {
  const kurRes = await fetchTcmbEurRate();
  const kur = kurRes.rate;
  const catalog = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));

  const yuksel = await auditYukselIthal(catalog, kur);
  const senox = await auditSenox(catalog, kur);

  const sy = summarize("YÜKSEL İTHAL", yuksel.rows);
  const ss = summarize("SENOX 2026-1", senox.rows);

  const outDir = path.join(ROOT, "scripts/data");
  const reportPath = path.join(outDir, "audit-yuksel-senox-fiyat-raporu.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        kur,
        formula:
          "liste × (1−iskonto) × 1,10 kar × kur × 1,20 KDV → fiyat_tl",
        yuksel: { iskonto: YUKSEL_ISK, kar: KAR, pdf: YUKSEL_ITHAL, ...sy },
        senox: { iskonto: SENOX_ISK, kar: KAR, ...ss },
      },
      null,
      2,
    ),
  );

  console.log("=== Fiyat denetimi (onay öncesi) ===");
  console.log(`Kur: 1 EUR = ${kur} TRY`);
  console.log(
    `Formül: liste × (1−iskonto) × 1,10 kar × kur × 1,20 KDV\n`,
  );

  for (const s of [sy, ss]) {
    console.log(`--- ${s.label} ---`);
    console.log(
      `  Sitede: ${s.total} | Fiyatlı: ${s.priced} | Uyumlu: ${s.ok} | Güncellenecek: ${s.bad.length} | Eksik liste: ${s.missing.length}`,
    );
    if (s.bad.length) {
      console.log("  En büyük sapmalar:");
      for (const r of s.bad.slice(0, 12)) {
        console.log(
          `    ${r.sku} | sitede ₺${fmt(r.cur)} → olmalı ₺${fmt(r.expected)} (${r.diff > 0 ? "+" : ""}${fmt(r.diff)}, liste ${r.listeEur}€)`,
        );
      }
      if (s.bad.length > 12) console.log(`    … +${s.bad.length - 12} ürün`);
    }
    console.log("");
  }

  console.log(`Rapor: ${path.relative(ROOT, reportPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
