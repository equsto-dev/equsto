#!/usr/bin/env node
/**
 * Portabianco bar blender fiyatları — Cafemarkt canlı −%7, KDV dahil fiyat_tl
 *   node scripts/sync-portabianco-bar-blender-prices.mjs
 *   node scripts/sync-portabianco-bar-blender-prices.mjs --fetch-cm
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");
const EKIPMANLAR = path.join(ROOT, "var/catalog/ekipmanlar.json");
const BAR_BLENDER_CODES = new Set(["251.1280", "251.1280D", "251.1280DK", "251.1280K"]);
const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");

const fetchCm = process.argv.includes("--fetch-cm");

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function priceFromCafemarkt(cmPriceKdvDahil) {
  const cm = Number(cmPriceKdvDahil);
  if (!cm || cm <= 0) return null;
  const kdvDahil = Math.round(cm * CM_MULT * 100) / 100;
  return {
    kdvDahil,
    price: `₺${fmtTry(kdvDahil)} KDV dahil`,
    fiyat_tl: Math.round(kdvDahil),
    cm_ref: cm,
  };
}

function applyPricing(row, cm, pricing) {
  row.price = pricing.price;
  row.fiyat_tl = pricing.fiyat_tl;
  row.fiyat_kaynak = "cafemarkt";
  row.cafemarkt_fiyat_kdv_dahil = pricing.cm_ref;
  row.cafemarkt_fiyat_equsto_kdv_dahil = pricing.kdvDahil;
  row.cafemarkt_indirim_oran = CM_DISCOUNT;
  if (EUR_TRY > 0) {
    row.liste_fiyati_eur = Math.round((pricing.cm_ref / EUR_TRY) * 100) / 100;
  }
  const base = String(row.specs || row.name || "").split("\n")[0];
  row.specs = [
    base,
    "Kaynak: Cafemarkt",
    `Model: ${cm.code}`,
    cm.url ? `Cafemarkt: ${cm.url}` : "",
    `Kaynak fiyat (Cafemarkt KDV dahil): ₺${fmtTry(pricing.cm_ref)}`,
    `Equsto Cafemarkt −%${Math.round(CM_DISCOUNT * 100)} (KDV dahil): ₺${fmtTry(pricing.kdvDahil)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function patchFile(filePath, cmByCode) {
  if (!fs.existsSync(filePath)) return { updated: 0, missing: [] };
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let updated = 0;
  const missing = [];
  for (const row of rows) {
    const code = String(row.sku || row.model || "").trim();
    if (!BAR_BLENDER_CODES.has(code)) continue;
    const cm = cmByCode.get(code);
    if (!cm?.price_try_kdv_dahil) {
      missing.push(code);
      continue;
    }
    const pricing = priceFromCafemarkt(cm.price_try_kdv_dahil);
    if (!pricing) continue;
    const prev = Number(row.fiyat_tl) || 0;
    applyPricing(row, cm, pricing);
    if (prev !== pricing.fiyat_tl) {
      updated++;
      console.log(`  ${code}: ₺${fmtTry(prev)} → ₺${fmtTry(pricing.fiyat_tl)} (CM ₺${fmtTry(pricing.cm_ref)})`);
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(rows));
  return { updated, missing };
}

if (fetchCm) {
  console.log("[bar-blender] Cafemarkt fiyatları çekiliyor…");
  const r = spawnSync("node", ["scripts/fetch-cafemarkt-portabianco.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
const cmByCode = new Map(cmRows.map((r) => [String(r.code || "").trim(), r]));

console.log("=== Portabianco bar blender fiyat senkronu ===");
console.log(`Kur: 1 EUR = ${EUR_TRY} | Cafemarkt −%${CM_DISCOUNT * 100}`);

const icecek = patchFile(ICECEK, cmByCode);
const ekip = patchFile(EKIPMANLAR, cmByCode);

console.log(`icecek.json: ${icecek.updated} güncellendi`);
console.log(`ekipmanlar.json: ${ekip.updated} güncellendi`);

const missing = [...new Set([...icecek.missing, ...ekip.missing])];
if (missing.length) {
  console.warn("Cafemarkt kaynağı eksik:", missing.join(", "));
  process.exit(1);
}

if (icecek.updated + ekip.updated > 0) {
  spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], { cwd: ROOT, stdio: "inherit" });
}

console.log("OK");
