/**
 * Katalog satırlarında elk/gaz kW denetimi — resolveKwFromSources.
 * Kullanım: node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs scripts/audit-catalog-kw.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPasifPfosEkipman,
  isPoweredPfosEkipman,
  parseMaxGucKwFromText,
  resolveKwFromSources,
} from "../lib/catalog/kw-resolve.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "var/catalog/ekipmanlar.json");
const rows = JSON.parse(readFileSync(catalogPath, "utf8"));

function allKwInBlob(text) {
  return [...String(text ?? "").matchAll(/([\d.,]+)\s*kW/gi)]
    .map((m) => Number(String(m[1]).replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
}

const missing = [];
const suspiciousLow = [];
const subsidiaryOnly = [];

for (const row of rows) {
  const ctx = {
    isim: row.name,
    urunTipi: row.category,
    sku: row.sku,
    urunAd: row.name,
  };
  if (isPasifPfosEkipman(ctx)) continue;
  if (!isPoweredPfosEkipman(ctx)) continue;

  const kw = resolveKwFromSources({
    sku: row.sku,
    urunAd: row.name,
    el_guc: row.el_guc,
    gaz_guc: row.gaz_guc,
    aciklama: row.aciklama ?? row.specs,
    detay: row.detay,
    description: row.description,
    ozti_web_description: row.ozti_web_description,
    inoksan_shop_description: row.inoksan_shop_description,
    pimak_web_description: row.pimak_web_description,
    teknik_ozellikler: row.teknik_ozellikler,
    olculer: row.olculer,
  });

  const blob = [
    row.name,
    row.specs,
    row.aciklama,
    ...(row.teknik_ozellikler ?? []),
  ]
    .filter(Boolean)
    .join("\n");
  const maxInText = parseMaxGucKwFromText(blob);
  const allKw = allKwInBlob(blob);
  const peakKw = allKw.length ? Math.max(...allKw) : null;

  if (kw.elektrikGucuKw == null && kw.gazGucuKw == null) {
    missing.push({ sku: row.sku, name: row.name, peakKw, maxInText });
    continue;
  }

  const elk = kw.elektrikGucuKw;
  if (
    elk != null &&
    peakKw != null &&
    peakKw >= 2 &&
    elk < peakKw - 0.5 &&
    maxInText != null &&
    maxInText >= peakKw - 0.01
  ) {
    suspiciousLow.push({
      sku: row.sku,
      name: row.name,
      resolvedElk: elk,
      maxInText,
      peakKw,
    });
  }

  if (
    /giyotin|bulasik|bulaşık|yikama|yıkama|bardak\s*yik|konveyor\s*bulasik/i.test(
      String(row.name),
    ) &&
    elk != null &&
    elk < 2 &&
    maxInText != null &&
    maxInText >= 2
  ) {
    subsidiaryOnly.push({
      sku: row.sku,
      name: row.name,
      resolvedElk: elk,
      maxInText,
    });
  }
}

const bym102 = resolveKwFromSources({
  sku: "INO-BYM102",
  urunAd: "BYM102",
  teknik_ozellikler: rows.find((r) => r.sku === "INO-BYM102")?.teknik_ozellikler,
});
const bym102s = resolveKwFromSources({
  sku: "INO-BYM102S",
  urunAd: "BYM102S",
  teknik_ozellikler: rows.find((r) => r.sku === "INO-BYM102S")?.teknik_ozellikler,
});

const report = {
  generated: new Date().toISOString(),
  total: rows.length,
  poweredChecked: rows.length - missing.length,
  missingPowered: missing.length,
  suspiciousLow: suspiciousLow.length,
  subsidiaryOnlyFixed: subsidiaryOnly.length,
  samples: {
    INO_BYM102: bym102,
    INO_BYM102S: bym102s,
  },
  missing: missing.slice(0, 40),
  suspiciousLow: suspiciousLow.slice(0, 40),
  subsidiaryOnly: subsidiaryOnly.slice(0, 20),
};

const outPath = join(root, "scripts/data/catalog-kw-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

console.log("[audit-catalog-kw] powered missing kW:", missing.length);
console.log("[audit-catalog-kw] suspicious low vs max in text:", suspiciousLow.length);
console.log("[audit-catalog-kw] INO-BYM102 elk:", bym102.elektrikGucuKw, "kW");
console.log("[audit-catalog-kw] INO-BYM102S elk:", bym102s.elektrikGucuKw, "kW");
console.log("[audit-catalog-kw] report →", outPath);

if (bym102.elektrikGucuKw != null && bym102.elektrikGucuKw < 2) {
  console.error("[audit-catalog-kw] FAIL — INO-BYM102 still too low");
  process.exit(1);
}
