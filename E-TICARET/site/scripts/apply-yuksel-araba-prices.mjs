#!/usr/bin/env node
/**
 * YÜKSEL YERLİ 2025 PDF arabalar → dept/araba.json fiyat (%55 iskonto)
 *
 *   npm run catalog:yuksel:araba:prices
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF = process.env.YUKSEL_PDF || String.raw`C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf`;
const PRICE_JSON = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/araba-fiyatlar.json");
const ARABA_JSON = path.join(ROOT, "public/data/dept/araba.json");
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = 1 - ISKONTO;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const KAYNAK = "yuksel-2025-yerli-pdf";
const LISTE = "YÜKSEL YERLİ - 2025";

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function normModel(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_tl: Math.round(netTry),
  };
}

function isYukselArabaRow(row) {
  const kaynak = String(row.kaynak_fiyat_listesi || "");
  const brand = String(row.brand || "");
  return (
    kaynak.includes("yuksel") ||
    /yuksel|avatherm/i.test(brand) ||
    String(row.id || "").startsWith("yukselsatis__")
  );
}

const NAME_RULES = [
  [/KUVERLİ|KUVERLI/, "M0182X"],
  [/KUVERSİZ|KUVERSIZ/, "M0180X"],
  [/TABAK OTOMATI.*TEKLİ|TABAK OTOMATI.*TEKLI/, "M0100X"],
  [/TABAK OTOMATI.*İKİLİ|TABAK OTOMATI.*IKILI/, "M0110X"],
  [/TABAK OTOMATI.*DÖRTLÜ|TABAK OTOMATI.*DORTLU/, "M0130X"],
  [/TABAK KARTU/, "M08221"],
  [/BULAŞIK TOPLAMA HAVUZU|BULASIK TOPLAMA HAVUZU/, "MB120X2"],
  [/BULAŞIK TOPLAMA.*TEL RAF.*İKİLİ|IKILI/, "MB114X4"],
  [/BULAŞIK TOPLAMA.*TEL RAF.*TEKLİ|TEKLI/, "MB110X4"],
  [/BULAŞIK TOPLAMA.*ÜÇLÜ|UCLU/, "MB108X2"],
  [/BULAŞIK TOPLAMA.*İKİLİ KOMPLE|IKILI KOMPLE/, "MB114X4"],
  [/BULAŞIK TOPLAMA.*KOMPLE SAC|KOMPLE SAÇ/, "MB100X2"],
  [/^BULAŞIK TOPLAMA ARABASI$|^BULASIK TOPLAMA ARABASI$/i, "MB100X2"],
  [/BULAŞIK TOPLAMA ARABASI İKİLİ/, "MB106X2"],
  [/KASET TAŞIMA.*KOLSUZ/, "MB130X2"],
  [/KASET TAŞIMA.*KOLLU/, "MB132X2"],
  [/KASET TAŞIMA.*ALÇAK|ALCAK/, "MB134X2"],
  [/KASET TAŞIMA.*YÜKSEK|YUKSEK/, "MB136X2"],
  [/50\*70|5070/, "MT132X2"],
  [/40\*60|4060/, "MT130X2"],
  [/GN 2\/1.*YÜKSEK|GN 2.1/, "MT152X2"],
  [/TEPSİ TAŞIMA.*YÜKSEK(?!.*GN)/i, "MT152X2"],
  [/ET ASKI|PASLANMAZ ET ASKI/, "MT120X"],
  [/ERZAK.*ÇİFT|CIFT KAPAK/, "MT142X"],
  [/ERZAK.*TEK KAPAK/, "MT140X"],
  [/YÜK TAŞIMA.*4 YAN/, "MT198G"],
  [/YÜK TAŞIMA.*2 YAN/, "MT196G"],
  [/PLATFORM TEL.*BÜYÜK|BUYUK/, "MT192G"],
  [/PLATFORM TEL.*KÜÇÜK|KUCUK/, "MT190G"],
  [/PLATFORM DÜZ ALÇAK/, "MT170X2"],
  [/SERVİS ARABASI 3 KATLI|SERVIS ARABASI 3 KATLI/, "MS102BA"],
  [/SERVİS ARABASI 2 KATLI|PASLANMAZ ÇELİK SERVİS ARABASI 2/, "MS120X2"],
  [/KİRLİ TOPLAMA|KIRLI TOPLAMA/, "C130B"],
  [/ASKI ARABASI/, "C120B"],
  [/ÇAMAŞIR SEPETİ|CAMASIR SEPETI/, "C122X"],
  [/SEPETLİ ARABA|SEPETLI ARABA/, "MT150X2"],
  [/KAZAN TENCERE/, "MT128X2"],
  [/400 TABAKLIK/, "MT162X2"],
  [/200 TABAKLIK/, "MT160X2"],
  [/EVYELİ ARABA|EVYELI ARABA/, "MB124X"],
  [/ÇÖP ARABASI|COP ARABASI/, "MB126X"],
  [/600×2|600 x2|600X2/i, "150255"],
  [/KULPSUZ/i, "150250"],
  [/KULPLU TROLLEY|KULPLU/i, "150245"],
];

function resolvePdfModel(row, pdf) {
  const keys = [row.sku, row.model].filter(Boolean).map(normModel);
  for (const k of keys) {
    if (pdf[k]) return { model: k, listEur: pdf[k], via: "sku" };
  }
  const n = String(row.name || "").toUpperCase();
  for (const [re, code] of NAME_RULES) {
    if (re.test(n) && pdf[code]) return { model: code, listEur: pdf[code], via: "name:" + code };
  }
  return null;
}

function applyPrice(row, hit) {
  const { netEur, price, fiyat_tl } = priceFromEuro(hit.listEur);
  row.price = price;
  row.fiyat_tl = fiyat_tl;
  row.liste_fiyati_eur = hit.listEur;
  row.satis_eur_net = netEur;
  row.iskonto_oran = Math.round(ISKONTO * 100);
  row.kaynak_fiyat_listesi = KAYNAK;
  delete row.fiyat_bekleniyor;
  if (!row.model || row.model === row.sku) row.model = hit.model;
  if (!row.sku || row.sku.includes("-")) row.sku = hit.model;
  const block = [
    row.name,
    "",
    `Kaynak: ${LISTE}`,
    `Model / kod: ${hit.model}`,
    `Liste fiyatı (EUR): ${hit.listEur}`,
    `Equsto net (%${Math.round(ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}`,
    `Kur: 1 EUR = ${EUR_TRY} TRY (KDV %${KDV})`,
    `Eşleşme: ${hit.via}`,
  ].join("\n");
  row.specs = row.specs ? `${block}\n\n---\n${row.specs}` : block;
}

function main() {
  const py = spawnSync("python", [path.join(ROOT, "scripts/extract-yuksel-araba-pdf.py"), PDF], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (py.status !== 0) {
    console.error(py.stderr || py.stdout || "PDF çıkarımı başarısız");
    process.exit(1);
  }

  const pdf = JSON.parse(fs.readFileSync(PRICE_JSON, "utf8"));
  const rows = JSON.parse(fs.readFileSync(ARABA_JSON, "utf8"));
  let applied = 0;
  let skipped = 0;
  const missed = [];

  for (const row of rows) {
    if (!isYukselArabaRow(row)) continue;
    if (row.fiyat_tl > 0 && row.kaynak_fiyat_listesi === KAYNAK) continue;
    const hit = resolvePdfModel(row, pdf);
    if (!hit) {
      skipped++;
      missed.push(row.name);
      continue;
    }
    applyPrice(row, hit);
    applied++;
    console.log(`[yuksel-araba] ${hit.model} €${hit.listEur} → ${row.name?.slice(0, 50)}`);
  }

  fs.writeFileSync(ARABA_JSON, JSON.stringify(rows), "utf8");
  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(
    `[yuksel-araba] ${applied} fiyat uygulandı, ${skipped} eşleşme yok, iskonto %${Math.round(ISKONTO * 100)}, EUR→TRY ${EUR_TRY}`,
  );
  if (missed.length) {
    console.log("[yuksel-araba] fiyatsız kalan:");
    for (const n of missed) console.log("  -", n);
  }
}

main();
