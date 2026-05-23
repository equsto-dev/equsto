/**
 * vitrum-besos-prices.json → vitrum-bars-catalogue.json + fallback + bar-design JSON-LD
 *
 *   npm run catalog:besos:prices
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRICES = path.join(ROOT, "public/data/vitrum-besos-prices.json");
const CATALOGUE = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");
const FALLBACK_JS = path.join(ROOT, "public/eq-vitrum-catalogue-fallback.js");
const BAR_HTML = path.join(ROOT, "public/bar-design.html");

const CODE_ALIASES = {
  "PL/IM.N-08": ["PL/IM.N-07", "PL/IM.N-08"],
  "PL/SM-04": ["SL/SM-04", "PL/SM-04"],
  "PL/NM.ND-2": ["PL/NM.ND.2", "PL/NM.ND-2"],
  "PL/SM.S.N.3-09": ["PL/BM.S.N.3-09", "PL/SM.S.N.3-09"],
};

function lookupPrice(prices, code) {
  if (prices[code]) return prices[code];
  for (const [canonical, aliases] of Object.entries(CODE_ALIASES)) {
    if (aliases.includes(code) && prices[canonical]) return prices[canonical];
  }
  return null;
}

function patchBarDesignOffers(html, priceByCode) {
  let patched = 0;
  let missing = [];
  const out = html.replace(
    /"sku": "([^"]+)"([\s\S]*?"offers": \{\s*"@type": "Offer",\s*"url": "[^"]+",\s*)"priceCurrency": "EUR"/g,
    (full, sku, mid) => {
      const p = lookupPrice(priceByCode, sku);
      if (!p) {
        missing.push(sku);
        return full;
      }
      if (full.includes('"price":')) return full;
      patched += 1;
      return (
        `"sku": "${sku}"${mid}"price": "${p.fiyatEurKdvDahil.toFixed(2)}",\n              "priceCurrency": "EUR"`
      );
    },
  );
  return { html: out, patched, missing };
}

function main() {
  if (!fs.existsSync(PRICES)) {
    console.error("Önce: python scripts/import-vitrum-besos-prices.py");
    process.exit(1);
  }
  const bundle = JSON.parse(fs.readFileSync(PRICES, "utf8"));
  const priceMap = bundle.prices || {};
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));

  let matched = 0;
  let unmatched = [];
  catalogue.pricingMeta = {
    source: bundle.source,
    importedAt: bundle.importedAt,
    formula: bundle.formula,
    iskontoOran: bundle.iskontoOran,
    kdvOran: bundle.kdvOran,
    currency: bundle.currency,
  };
  catalogue.products = catalogue.products.map((p) => {
    const pricing = lookupPrice(priceMap, p.code);
    if (!pricing) {
      unmatched.push(p.code);
      const { pricing: _old, ...rest } = p;
      return rest;
    }
    matched += 1;
    return {
      ...p,
      pricing: {
        ...pricing,
        currency: "EUR",
        priceValidUntil: "2026-12-31",
      },
      fiyatEurKdvDahil: pricing.fiyatEurKdvDahil,
      priceCurrency: "EUR",
    };
  });

  catalogue.pricedAt = new Date().toISOString();
  fs.writeFileSync(CATALOGUE, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
  fs.writeFileSync(
    FALLBACK_JS,
    "window.__VITRUM_CATALOGUE_FALLBACK=" + JSON.stringify(catalogue) + ";\n",
    "utf8",
  );

  let html = fs.readFileSync(BAR_HTML, "utf8");
  const { html: newHtml, patched, missing } = patchBarDesignOffers(html, priceMap);
  if (patched > 0) {
    fs.writeFileSync(BAR_HTML, newHtml, "utf8");
  }

  console.log("Catalogue:", matched, "priced,", unmatched.length, "without PDF price");
  if (unmatched.length) console.log("  unmatched:", unmatched.join(", "));
  console.log("JSON-LD offers patched:", patched);
  if (missing.length) console.log("  JSON-LD missing:", [...new Set(missing)].join(", "));
  console.log("Wrote", CATALOGUE, FALLBACK_JS);
}

main();
