/**
 * ATALAY 2025 — Döner Makineleri kataloğu → scripts/data/atalay-doner-ocak.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DONER_OCAK_ROWS } from "./data/atalay-doner-ocak-source.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts/data/atalay-doner-ocak.json");

const DISCOUNT = 0.4;
const EUR_TRY = Number(process.env.EQUSTO_EUR_TRY || "36");

function slugify(model) {
  return `atalay-${model.toLowerCase().replace(/\+/g, "-plus-")}`;
}

const products = DONER_OCAK_ROWS.map((row) => {
  const energi = row.model.startsWith("ADE") ? "elektrik" : "gaz";
  const el =
    row.kwEl != null
      ? `${row.kwEl} kW`
      : null;
  const gaz =
    row.kwLpg != null && row.kwNg != null
      ? `LPG ${row.kwLpg} kW · NG ${row.kwNg} kW`
      : null;
  const priceTl = Math.round(row.euro * EUR_TRY * (1 - DISCOUNT));

  return {
    modelCode: row.model,
    slug: slugify(row.model),
    name: `Atalay Döner Ocağı ${row.model} — ${row.section}`,
    section: row.section,
    energi,
    alt_tip: row.section,
    radyan: row.radyan,
    el_guc_kw: row.kwEl ?? null,
    el_guc: el,
    gaz_guc_kw_lpg: row.kwLpg ?? null,
    gaz_guc_kw_ng: row.kwNg ?? null,
    gaz_guc: gaz,
    voltaj: row.voltaj,
    priceEuroCatalog: row.euro,
    priceEuroSite: Math.round(row.euro * (1 - DISCOUNT) * 100) / 100,
    priceTl,
    eurTryRate: EUR_TRY,
    discountRate: DISCOUNT,
    imagePath: `/images/catalog/atalay/doner/${slugify(row.model)}.jpg`,
    imageNote: "Görsel: admin veya public/images/catalog/atalay/doner/ altına model adıyla yükleyin",
  };
});

const manifest = {
  version: 1,
  source: "ATALAY 2025 YERLİ.pdf — Döner Makineleri (sayfa 129–144)",
  parsedAt: new Date().toISOString(),
  discountPercent: 40,
  eurTryRate: EUR_TRY,
  count: products.length,
  products,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf8");
console.log(`[parse] ${products.length} döner ocağı → ${OUT}`);
