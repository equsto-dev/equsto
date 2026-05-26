/**
 * PDF fiyat listesi + görsel eşlemesi sonrası katalog adlarını ve fiyatları senkronize et.
 *
 *   npm run catalog:besos:sync
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VITRUM_DISPLAY_NAMES } from "./vitrum-besos-image-map.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");
const PRICES = path.join(ROOT, "public/data/vitrum-besos-prices.json");
const FALLBACK_JS = path.join(ROOT, "public/eq-vitrum-catalogue-fallback.js");

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

function main() {
  const pdf = process.argv[2] || path.join(process.env.USERPROFILE || "", "Downloads", "Vitrum+Bar+Price+List+October+2025.pdf");
  const importPy = path.join(ROOT, "scripts/import-vitrum-besos-prices.py");
  const r = spawnSync("python", [importPy, pdf], { encoding: "utf8", cwd: ROOT });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }

  const priceMap = JSON.parse(fs.readFileSync(PRICES, "utf8")).prices;
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
  let priced = 0;
  let missing = [];

  catalogue.products = catalogue.products.map((p) => {
    const pricing = lookupPrice(priceMap, p.code);
    const name = VITRUM_DISPLAY_NAMES[p.code] || p.name;
    if (!pricing) {
      missing.push(p.code);
      const { pricing: _old, ...rest } = p;
      return { ...rest, name };
    }
    priced++;
    return {
      ...p,
      name,
      pricing: { ...pricing, currency: "EUR", priceValidUntil: "2026-12-31" },
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
  console.log(`Priced ${priced}/${catalogue.products.length}`);
  if (missing.length) console.log("Missing prices:", missing.join(", "));
}

main();
