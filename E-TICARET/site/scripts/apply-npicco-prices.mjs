#!/usr/bin/env node
/**
 * NPICCO 2026 PDF fiyatları → dept/pisirme.json (%40 iskonto, müşteri %60 öder)
 *
 *   node scripts/apply-npicco-prices.mjs
 *   node scripts/apply-npicco-prices.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_FILE = path.join(ROOT, "public/data/dept/pisirme.json");
const dryRun = process.argv.includes("--dry-run");

const NPICCO_PRICES = {
  // Page 1
  "22.1": 4900,
  "22.2": 6450,
  "22.3": 7800,
  "22.4": 10450,
  "22.5": 5450,
  "22.6": 7350,
  "22.7": 9350,
  "22.8": 12000,
  "88.1": 5100,
  "88.2": 7100,
  "88.3": 8490,
  "88.4": 11110,
  "88.5": 7110,
  "88.6": 9350,
  "88.7": 11550,
  "88.8": 15110,
  "23": 9350,
  // Page 2
  "64.1": 12000,
  "63.1": 10000,
  "24.1": 6250,
  "24.2": 8450,
  "24.3": 9110,
  "24.4": 11800,
  "25.1": 6890,
  "25.2": 9350,
  "25.3": 10450,
  "25.4": 13110,
  "254": 13110,
  "26.1": 6700,
  "26.2": 9110,
  "26.3": 10250,
  "26.4": 13110,
  "27.1": 6700,
  "27.2": 9110,
  "27.3": 9800,
  "27.4": 13350,
  "27.5": 8250,
  "27.6": 11110,
  // Page 3
  "27.7": 12890,
  "27.8": 16890,
  "28.1": 8000,
  "28.2": 9350,
  "29.1": 9550,
  "29.2": 11550,
  "30.1": 12700,
  "31.1": 7110,
  "31.2": 10250,
  "31.3": 11350,
  "31.4": 14000,
  "32.1": 22250,
  "33.1": 14000,
  "34.1": 19300,
  "35.1": 25850,
  "36.1": 25110,
  "37.1": 14700,
  "38.1": 24890,
  // Page 4
  "39.1": 4250,
  "40.1": 1110,
  "43.1": 7350,
  "41.1": 10890,
  "41.2": 10890,
  "44.1": 8000,
  "90.1": 26000,
  "45.1": 34250,
  "45.2": 39110,
  "42.1": 7110,
  "46.1": 6890,
  "47.1": 12450,
  "48.1": 1200,
  "49.1": 3400,
  "93.1": 16000,
  "53.1": 38250,
  "54.1": 11350,
  "55.1": 11350,
  "56.1": 31650,
  "57.1": 20450,
  "70.1": 24890,
  // Page 5
  "76.1": 24000,
  "75.1": 15110,
  "58.1": 18400,
  "59.1": 12250,
  "60.1": 10000,
  "60.2": 10890,
  "61.1": 9110,
  "61.2": 10000,
  "62.1": 11800,
  "65.1": 13350,
  "66.1": 34250,
  "67.1": 13110,
  "68.1": 8700,
  "69.1": 10700,
  "71.1": 11110,
  "72.1": 19800,
  "72.2": 19800,
  "72.3": 22450,
  // Page 6
  "73.1": 16890,
  "74.1": 12000,
  "85.1": 13110,
  "84.1": 13550,
  "52.1": 4000,
  "51.1": 4250,
  "50.1": 2900,
  "89.1": 2700,
  "87.1": 8700,
  "92.1": 5350,
  "91.1": 7800,
  "86.1": 2900,
  "77.1": 8100,
  "77.2": 8800,
  "77.3": 9110,
  "77.4": 9900,
  "78.1": 13200,
  "79.1": 14400,
  "78.2": 12700,
  // Page 7
  "80.1": 7800,
  "81.1": 4900,
  "82.1": 3200,
  "248.1": 4750,
  "248.2": 3370,
  "83.1": 5800,
  "330.1": 460,
  "330.2": 400,
  "330.3": 550,
  "330.4": 620,
  "331.1": 440,
  "901": 1864,
  "902": 2563,
  "903": 2097,
  "904": 2912,
  "910": 2236,
  "911": 3075,
  // Page 8
  "912": 2469,
  "913": 3425,
  "914": 2330,
  "915": 3029,
  "916": 2255,
  "917": 3611,
  "906": 2702,
  "907": 3541,
  "908": 2628,
  "909": 4124,
  "701.1": 1661,
  "701.2": 1903,
  // Page 9
  "701.3": 1712,
  "702.1": 2013,
  "702.2": 2213,
  "702.3": 2043,
  "711.1": 1363,
  "711.2": 1661,
  "711.3": 1503,
  "712.1": 1817,
  "712.2": 2043,
  "712.3": 1957,
  "918": 3634,
  "919": 3960,
  "920": 4368,
  // Page 10
  "921": 4543,
  "227": 4700,
  "228": 4500,
  "905": 4900,
  "221": 7770,
  "220": 5890,
  "222.1": 3890,
  "222.2": 7530,
  "223.1": 2970,
  "223.2": 6000,
  "223.3": 8830,
  "223.4": 11630,
  "284": 2700
};

function normalizeSku(sku) {
  return String(sku || "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${v.toLocaleString("tr-TR")},00`;
}

function npiccoPricingBlock(row, px) {
  const title = String(row.name || row.sku || "").trim();
  return [
    title,
    "",
    `Model: ${row.sku || row.model || ""}`,
    `Liste fiyatı (USD): $${px.liste_fiyati_usd.toLocaleString("en-US")}`,
    `Equsto iskonto: %40 (ödeme oranı %60)`,
    `Equsto satış (USD): $${px.satis_usd_indirimli.toLocaleString("en-US")}`,
    `Hesap: liste × 0.60`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(px.fiyat_tl)}`,
    `Kur: 1 USD = ${px.kur_usd_try} TRY (KDV %20)`,
    `Kaynak: NPICCO 2026 Fiyat Listesi`,
  ].join("\n");
}

function mergeNpiccoSpecs(row, pricingBlock) {
  const old = String(row.specs || "");
  const keepIdx = old.search(/\n\n(?:Ölçüler|Ürün özellikleri|Teknik özellikler)/i);
  const suffix = keepIdx >= 0 ? old.slice(keepIdx) : "";
  return pricingBlock + suffix;
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  if (!fs.existsSync(DEPT_FILE)) {
    console.error("pisirme.json bulunamadı — önce npm run catalog:npicco:import");
    process.exit(1);
  }

  const rates = await fetchTcmbEurUsdRates();
  const usdTry = Number(process.env.EQUSTO_USD_TRY) > 0 ? Number(process.env.EQUSTO_USD_TRY) : rates.usdTry;
  const eurTry = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : rates.eurTry;

  const rows = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  let matched = 0;
  const unmatched = [];

  for (const row of rows) {
    if (String(row?.brand).toLowerCase() !== "npicco") continue;

    const sku = row.sku || row.urun_kodu || "";
    let cleanSku = normalizeSku(sku);

    if (cleanSku.startsWith("NPICCO-")) {
      // Check special fallbacks
      if (cleanSku === "NPICCO-33728") {
        cleanSku = "NPICCO72.3";
      }
    }

    if (cleanSku.startsWith("NPICCO")) {
      const code = cleanSku.substring(6); // e.g., "22.1" or "284"
      const listeUsd = NPICCO_PRICES[code];

      if (listeUsd != null) {
        const satisUsd = Math.round(listeUsd * 0.6 * 100) / 100;
        const netTl = Math.round(satisUsd * usdTry);
        const kdvDahil = Math.round(netTl * 1.20);

        const px = {
          liste_fiyati_usd: listeUsd,
          satis_usd_indirimli: satisUsd,
          iskonto_oran: 40,
          satis_oran: 0.60,
          bayi_iskonto: 0.40,
          para_birimi: "USD",
          kur_usd_try: usdTry,
          kur_eur_try: eurTry,
          fiyat_tl_net: netTl,
          fiyat_tl: kdvDahil,
          kdv_oran: 20,
          price: `${fmtTry(kdvDahil)} KDV dahil`,
          fiyat_bekleniyor: false,
          fiyat_kaynagi: "npicco-2026-fiyat-listesi",
          kaynak_fiyat_listesi: "npicco-2026-fiyat-listesi",
        };

        row.price = px.price;
        row.specs = mergeNpiccoSpecs(row, npiccoPricingBlock(row, px));
        Object.assign(row, px);
        matched += 1;
      } else {
        unmatched.push(sku);
      }
    } else {
      unmatched.push(sku);
    }
  }

  if (!dryRun && matched > 0) {
    writeJsonAtomic(DEPT_FILE, rows);
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log(`[npicco-prices] ${dryRun ? "DRY-RUN" : "OK"} ${matched} ürün fiyatlandı`);
  console.log(`  Kur: 1 USD = ${usdTry} TRY, 1 EUR = ${eurTry} TRY`);
  if (unmatched.length) {
    console.log(`  Fiyat eşleşmeyen (${unmatched.length}):`, unmatched.slice(0, 40).join(", "));
    if (unmatched.length > 40) console.log(`    … +${unmatched.length - 40} daha`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
