/**
 * Public /pfos sihirbaz dalları — aktif paketlerle uyum testi
 * Kullanım: node scripts/test-pfos-public-wizard.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");

function read(p) {
  return JSON.parse(fs.readFileSync(path.join(SITE, p), "utf8"));
}

const branches = read("public/data/pfos-wizard-branches.json");
const kafe = branches.dukkanBySegment["Kafe / Coffee Shop"] || [];
const mustHave = [
  "Casual Cafe",
  "Harvest Cafe",
  "All Sport Cafe",
  "Coffee Shop",
  "Kahve Atölyesi",
];
const missing = mustHave.filter((x) => !kafe.includes(x));
const planlananLeak = kafe.filter((x) => x === "Kafeterya");

let ok = true;
if (missing.length) {
  console.error("EKSIK kafe paketleri:", missing.join(", "));
  ok = false;
}
if (planlananLeak.length) {
  console.error("Planlanan paket sızıntısı (olmamalı):", planlananLeak.join(", "));
  ok = false;
}
if (!branches.konseptRows?.some((r) => r.v === "Kafe / Coffee Shop")) {
  console.error("KONSEPT_ROWS icinde Kafe / Coffee Shop yok");
  ok = false;
}
const casual = branches.m2ByDukkan?.["Casual Cafe"];
if (!casual || casual.min !== 50 || casual.max !== 150) {
  console.error("Casual Cafe m2 bandi hatali:", casual);
  ok = false;
}

if (ok) {
  console.log("OK — public wizard:", branches.aktifPaketSayisi, "aktif paket");
  console.log("Kafe:", kafe.join(" | "));
  process.exit(0);
}
process.exit(1);
