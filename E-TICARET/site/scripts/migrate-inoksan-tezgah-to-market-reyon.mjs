#!/usr/bin/env node
/**
 * Tezgah dept'teki İnoksan ürünleri → market-reyon / self-servis-hatti
 *   node scripts/migrate-inoksan-tezgah-to-market-reyon.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEZGAH = path.join(ROOT, "public/data/dept/tezgah.json");
const MARKET = path.join(ROOT, "public/data/dept/market-reyon.json");
const dryRun = process.argv.includes("--dry-run");

const OLD_CATEGORIES = [
  "servis-tezgahlari",
  "drop-i-n-soguk-uniteler",
  "drop-i-n-sicak-uniteler",
  "tepsi-standi",
  "sicak-servis-uniteleri",
  "bulasik-siyirma-tezgahlari",
  "standart-servis-hatti",
  "self-servis-hatti",
];

function isInoksanRow(r) {
  return r?.brand === "İnoksan" && r?.dept === "tezgah";
}

function normalizeText(s) {
  let out = String(s || "");
  out = out.replace(/Kategori: Tezgahlar[^\n]*/g, "Kategori: Self-Servis Hattı");
  out = out.replace(/Kategori: Servis Hatları[^\n]*/g, "Kategori: Self-Servis Hattı");
  for (const old of OLD_CATEGORIES) {
    out = out.replace(new RegExp(old, "g"), "self-servis-hatti");
  }
  return out;
}

function toMarketRow(r) {
  return {
    ...r,
    dept: "market-reyon",
    category: "self-servis-hatti",
    tileId: "self-servis",
    specs: normalizeText(r.specs),
    aciklama: normalizeText(r.aciklama),
    keywords: [
      ...(r.keywords || []).filter(
        (k) =>
          k &&
          k !== "tezgah" &&
          k !== "Tezgahlar" &&
          !OLD_CATEGORIES.includes(k) &&
          k !== "Servis Hatları" &&
          k !== "Standart Servis Hatları" &&
          k !== "Klasik Seri Servis Hattı",
      ),
      "self-servis-hatti",
      "Self-Servis Hattı",
      "Servis & Teşhir",
      "İnoksan",
    ].filter((k, i, a) => k && a.indexOf(k) === i),
  };
}

function main() {
  const tezgah = JSON.parse(fs.readFileSync(TEZGAH, "utf8"));
  const market = JSON.parse(fs.readFileSync(MARKET, "utf8"));
  const moving = tezgah.filter(isInoksanRow);
  if (!moving.length) {
    console.error("[migrate-inoksan] tezgah'ta taşınacak İnoksan ürün yok");
    process.exit(1);
  }
  const skus = new Set(moving.map((r) => r.sku));
  const newTezgah = tezgah.filter((r) => !skus.has(r.sku));
  const keptMarket = market.filter((r) => !skus.has(r.sku));
  const newMarket = [...keptMarket, ...moving.map(toMarketRow)];

  const byCat = Object.fromEntries(
    [...new Set(moving.map((r) => r.category))].map((c) => [c, moving.filter((r) => r.category === c).length]),
  );

  console.log(
    `[migrate-inoksan] ${dryRun ? "DRY-RUN" : "OK"} | ${moving.length} ürün tezgah → market-reyon/self-servis-hatti`,
  );
  console.log("  kaynak kategoriler:", byCat);
  console.log(`  tezgah: ${tezgah.length} → ${newTezgah.length}`);
  console.log(`  market-reyon: ${market.length} → ${newMarket.length}`);

  if (!dryRun) {
    fs.writeFileSync(TEZGAH, JSON.stringify(newTezgah), "utf8");
    fs.writeFileSync(MARKET, JSON.stringify(newMarket), "utf8");
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main();
