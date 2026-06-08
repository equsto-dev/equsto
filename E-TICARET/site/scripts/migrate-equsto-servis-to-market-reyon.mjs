#!/usr/bin/env node
/**
 * Tezgah dept'teki Equsto servis hattı → market-reyon / self-servis-hatti
 *   node scripts/migrate-equsto-servis-to-market-reyon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEZGAH = path.join(ROOT, "public/data/dept/tezgah.json");
const MARKET = path.join(ROOT, "public/data/dept/market-reyon.json");
const KAYNAK = "equsto-inoksan-servis-hatti";
const dryRun = process.argv.includes("--dry-run");

function isServisRow(r) {
  return (
    r?.brand === "Equsto" &&
    (r?.kaynak === KAYNAK ||
      r?.category === "standart-servis-hatti" ||
      r?.category === "self-servis-hatti")
  );
}

function toMarketRow(r) {
  const specs = String(r.specs || "")
    .replace(/Kategori: Standart Servis Hattı/g, "Kategori: Self-Servis Hattı")
    .replace(/standart-servis-hatti/g, "self-servis-hatti");
  return {
    ...r,
    dept: "market-reyon",
    category: "self-servis-hatti",
    tileId: "self-servis",
    specs,
    aciklama: String(r.aciklama || "").replace(
      /Kategori: Standart Servis Hattı/,
      "Kategori: Self-Servis Hattı",
    ),
    keywords: [
      ...(r.keywords || []).filter((k) => k !== "standart-servis-hatti" && k !== "Standart Servis Hattı"),
      "self-servis-hatti",
      "Self-Servis Hattı",
      "Servis & Teşhir",
    ].filter((k, i, a) => k && a.indexOf(k) === i),
  };
}

function main() {
  const tezgah = JSON.parse(fs.readFileSync(TEZGAH, "utf8"));
  const market = JSON.parse(fs.readFileSync(MARKET, "utf8"));
  const moving = tezgah.filter(isServisRow);
  if (!moving.length) {
    console.error("[migrate-servis] tezgah'ta taşınacak ürün yok");
    process.exit(1);
  }
  const skus = new Set(moving.map((r) => r.sku));
  const newTezgah = tezgah.filter((r) => !skus.has(r.sku));
  const keptMarket = market.filter((r) => !skus.has(r.sku));
  const newMarket = [...keptMarket, ...moving.map(toMarketRow)];

  console.log(
    `[migrate-servis] ${dryRun ? "DRY-RUN" : "OK"} | ${moving.length} ürün tezgah → market-reyon/self-servis-hatti`,
  );
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
