/**
 * Excel net alış (liste × (1−iskonto)) vs katalog alis/satis — %8 kar kontrolü
 *   node scripts/verify-ozti-net-plus-kar.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { oztiPricingFields, OZTI_EQUSTO_KAR_ORAN } from "./lib/ozti-enrich.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const XLSX = String.raw`c:\D Disk\FİYAT LİSTELERİ\Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx`;
const EKIPMAN = path.join(ROOT, "public/data/ekipmanlar.json");
const KUR = 53.2979;
const TOL = 0.02;

function loadXlsxRows() {
  const py = path.join(ROOT, "scripts/trial-ozti-parse-xlsx.py");
  const r = spawnSync("python", [py], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
    timeout: 180000,
  });
  if (r.status !== 0) throw new Error(r.stderr || "xlsx parse failed");
  return JSON.parse(r.stdout);
}

function excelBayiNet(row) {
  const liste = Number(row.liste_fiyati ?? row.liste_fiyati_eur) || 0;
  const isk = Number(row.bayi_iskonto);
  if (!(liste > 0)) return null;
  if (!(isk > 0 && isk < 1)) return liste;
  return Math.round(liste * (1 - isk) * 100) / 100;
}

function near(a, b, tol = TOL) {
  if (a == null || b == null) return false;
  return Math.abs(a - b) < tol || Math.abs(a - b) / Math.max(a, b) < 0.001;
}

function main() {
  const xlsx = loadXlsxRows();
  const cat = JSON.parse(fs.readFileSync(EKIPMAN, "utf8"));
  const bySku = new Map();
  for (const p of cat) {
    if (!p.sku || !/öztiryaki|oztiryaki/i.test(String(p.brand || ""))) continue;
    bySku.set(String(p.sku).replace(/\s+/g, "").toUpperCase(), p);
  }

  let okAlis = 0;
  let okSatis = 0;
  let missing = 0;
  let badAlis = 0;
  let badSatis = 0;
  const badSamples = [];

  for (const row of xlsx) {
    const kod = String(row.urun_kodu || "").replace(/\s+/g, "").toUpperCase();
    const excelNet = excelBayiNet(row);
    if (!(excelNet > 0)) continue;

    const exp = oztiPricingFields(row, KUR);
    const p = bySku.get(kod);

    if (!p) {
      missing++;
      continue;
    }

    const alis = Number(p.alis_fiyati_eur ?? p.alis_fiyati);
    const satis = Number(p.satis_fiyati_eur ?? p.satis_eur_indirimli);
    const expEqusto = Math.round(excelNet * (1 + OZTI_EQUSTO_KAR_ORAN) * 100) / 100;

    if (near(alis, excelNet)) okAlis++;
    else {
      badAlis++;
      if (badSamples.length < 8) {
        badSamples.push({ kod, tip: "alis", excelNet, katalog: alis, exp: exp.alis_fiyati_eur });
      }
    }

    if (near(satis, expEqusto)) okSatis++;
    else {
      badSatis++;
      if (badSamples.length < 12) {
        badSamples.push({ kod, tip: "satis+8%", excelNet, beklenen: expEqusto, katalog: satis });
      }
    }
  }

  console.log("\n=== Öztiryakiler: Excel net alış + %8 kar doğrulama ===\n");
  console.log("Excel ürün:", xlsx.length);
  console.log("Katalogda eşleşen:", okAlis + okSatis, "satır çifti");
  console.log("alis_fiyati_eur = Excel net:", okAlis, "| sapma:", badAlis);
  console.log("satis_fiyati_eur = net × 1,08:", okSatis, "| sapma:", badSatis);
  console.log("Katalogda yok:", missing);
  console.log("OZTI_EQUSTO_KAR_ORAN:", OZTI_EQUSTO_KAR_ORAN);
  if (badSamples.length) {
    console.log("\nÖrnek sapmalar:");
    for (const s of badSamples) console.log(s);
  }
  console.log(
    badAlis === 0 && badSatis === 0
      ? "\nOK — tüm eşleşen satırlarda net alış + %8 doğru.\n"
      : "\nUYARI — sapma var; rebuild veya merge kontrol edin.\n",
  );
  process.exit(badAlis === 0 && badSatis === 0 ? 0 : 1);
}

main();
