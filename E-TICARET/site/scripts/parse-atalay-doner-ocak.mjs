/**
 * ATALAY 2025 — Döner Makineleri kataloğu → scripts/data/atalay-doner-ocak.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DONER_OCAK_ROWS } from "./data/atalay-doner-ocak-source.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts/data/atalay-doner-ocak.json");
const OUT_PUBLIC = path.join(ROOT, "public/data/atalay-doner-ocak.json");
const KUR_JSON = path.join(ROOT, "public/data/equsto-eur-try-rate.json");

const DISCOUNT = 0.4;
const tcmb = await fetchTcmbEurRate();
const EUR_TRY = tcmb.rate;
const TCMB_DATE = tcmb.tcmbDate;

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
    eurTrySource: tcmb.fallback ? "fallback" : "tcmb_efektif_satis",
    tcmbDate: TCMB_DATE,
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
  eurTrySource: tcmb.fallback ? "fallback" : "tcmb_efektif_satis",
  tcmbDate: TCMB_DATE,
  count: products.length,
  products,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const json = JSON.stringify(manifest, null, 2);
fs.writeFileSync(OUT, json, "utf8");
fs.mkdirSync(path.dirname(OUT_PUBLIC), { recursive: true });
fs.writeFileSync(OUT_PUBLIC, json, "utf8");

const kurPayload = {
  version: 1,
  rate: EUR_TRY,
  type: "efektif_satis",
  label: "TCMB Efektif Satış",
  source: tcmb.fallback ? "fallback" : "tcmb",
  date: TCMB_DATE,
  updatedAt: new Date().toISOString(),
};
fs.mkdirSync(path.dirname(KUR_JSON), { recursive: true });
fs.writeFileSync(KUR_JSON, JSON.stringify(kurPayload, null, 2), "utf8");

console.log(
  `[parse] ${products.length} döner ocağı → ${OUT} (EUR/TRY=${EUR_TRY}${TCMB_DATE ? `, TCMB ${TCMB_DATE}` : ""})`
);
