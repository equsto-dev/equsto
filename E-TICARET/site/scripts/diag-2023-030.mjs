#!/usr/bin/env node
/**
 * 2023-030.pdf parse + liste quote diagnostic
 * node scripts/diag-2023-030.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = "c:/D Disk/2023/2023-030 HİSAR CAFE/2023-030.pdf";
const OUT = "c:/Users/adema/Downloads/equsto-teklif-EQS-2026-919.pdf";

async function loadTs(rel) {
  const url = pathToFileURL(path.join(ROOT, rel)).href;
  return import(url);
}

async function extractPdfText(file) {
  const buf = readFileSync(file);
  const p = await pdf(buf);
  return String(p.text ?? "");
}

async function main() {
  const { parseProformaPdfBuffer } = await loadTs("lib/pfos/liste-proforma-pdf.ts");
  const { calculateListeQuote } = await loadTs("lib/pfos/liste-fiyat.ts");
  const { pfosResponseToTeklifV14 } = await loadTs("lib/pfos/teklif/map-pfos-response.ts");

  const srcBuf = readFileSync(SRC);
  const parsed = await parseProformaPdfBuffer(srcBuf);
  console.log("=== PARSE ===", parsed?.length ?? "null (fallback to Claude)");

  if (parsed) {
    for (const i of parsed) {
      console.log(
        `${i.poz}\t${(i.ham_isim || "").slice(0, 50)}\t${i.olcu || ""}\t${i.adet}`,
      );
    }
  } else {
    const text = await extractPdfText(SRC);
    console.log("raw text len", text.length);
    console.log(text.slice(0, 800));
  }

  if (!parsed?.length) {
    console.log("\nParse failed — cannot run quote without API");
    return;
  }

  console.log("\n=== QUOTE ===");
  const res = await calculateListeQuote({
    importKalemler: parsed,
    kaynakDosya: "2023-030.pdf",
    kaynakTip: "pdf",
    projeAdi: "Hisar Cafe",
    sehir: "İstanbul",
  });

  const eslesme = res.kalemler.filter((k) => k.urun?.fiyat > 0 || k.urun?.fiyatEur > 0).length;
  console.log("kalem", res.kalemler.length, "fiyatli", eslesme, "uyari", res.uyarilar?.length);

  const problem = [];
  for (const k of res.kalemler) {
    const u = k.urun;
    const sku = u?.sku || "—";
    const fiyat = u?.fiyat ?? 0;
    const gorsel = u?.gorselUrl || "—";
    const marka = u?.marka || "—";
    if (!fiyat) problem.push({ poz: k.poz, isim: k.isim, sku, reason: "fiyat yok" });
    console.log(
      `${k.poz}\t${k.isim.slice(0, 40)}\t${sku}\t${fiyat}\t${marka}\t${(gorsel || "").slice(-40)}`,
    );
  }

  if (problem.length) {
    console.log("\n=== FİYATSIZ ===");
    problem.forEach((p) => console.log(p.poz, p.isim.slice(0, 40), p.sku));
  }

  const v14 = pfosResponseToTeklifV14(res, {
    projeAdi: "Hisar Cafe",
    teslimatAdresi: "İstanbul",
    bolumM2: {},
    eurTry: 53,
    sayi: "EQS-2026-919",
  });

  console.log("\n=== V14 SAMPLE (first 15 data rows) ===");
  const rows = v14.satirlar.filter((r) => r.poz && !r.bolumBaslik?.startsWith("—"));
  for (const r of rows.slice(0, 15)) {
    console.log(
      `${r.poz}\t${r.tanim?.slice(0, 45)}\t${r.stokNo}\t${r.birimSatis}\t${(r.fotoUrl || "").slice(-45)}`,
    );
  }

  if (readFileSync(OUT, { flag: "r" })) {
    const outText = await extractPdfText(OUT);
    console.log("\n=== OUTPUT PDF text sample ===");
    console.log(outText.slice(0, 1500));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
