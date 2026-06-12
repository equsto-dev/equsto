/**
 * Deploy öncesi Yüksel Endüstriyel taşıma arabası + AVATHERM tasima kilidi.
 * Kilit: public/yukselendustriyel-araba-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAvathermRow } from "./lib/avatherm-tasima.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KILIT_COMMIT = "11d61231";
const MIN_TASIMA_ARABALARI = 38;
const MIN_AVATHERM_TASIMA = 41;

let err = 0;

function fail(msg) {
  console.error("[verify-yukselendustriyel-araba-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/yukselendustriyel-araba-KILIT.txt");
mustExist("scripts/lib/avatherm-tasima.mjs");
mustExist("scripts/data/yukselendustriyel-araba-catalog.json");

const kilit = read("public/yukselendustriyel-araba-KILIT.txt");
if (!kilit.includes(KILIT_COMMIT)) {
  fail(`yukselendustriyel-araba-KILIT.txt: commit ${KILIT_COMMIT} yok`);
}
if (!kilit.includes("isAvathermRow")) fail("KILIT: AVATHERM → tasima kuralı yok");
if (!kilit.includes("catalog:yukselendustriyel:araba")) fail("KILIT: npm script yok");

const sync = read("scripts/sync-yukselendustriyel-araba.mjs");
if (!sync.includes("KİLİT: public/yukselendustriyel-araba-KILIT.txt")) {
  fail("sync-yukselendustriyel-araba.mjs: kilit yorumu yok");
}
if (!sync.includes("isAvathermRow")) fail("sync-yukselendustriyel-araba.mjs: isAvathermRow import yok");
if (/startsWith\("yukselsatis__"\)/.test(sync)) {
  fail("sync-yukselendustriyel-araba.mjs: yukselsatis__ isArabaRow geri gelmiş");
}

const avathermLib = read("scripts/lib/avatherm-tasima.mjs");
if (!avathermLib.includes("dept = \"tasima\"")) fail("avatherm-tasima.mjs: dept tasima yok");

const yukselsatis = read("scripts/sync-yukselsatis-catalog.mjs");
if (!yukselsatis.includes("avathermTasimaCategory")) {
  fail("sync-yukselsatis-catalog.mjs: avathermTasimaCategory yok");
}
if (/avatherm\(\?!-tepsi\)/.test(yukselsatis)) {
  fail("sync-yukselsatis-catalog.mjs: AVATHERM catering grubunda kalmış");
}

const pkg = read("package.json");
if (!pkg.includes('"catalog:yukselendustriyel:araba"')) {
  fail("package.json: catalog:yukselendustriyel:araba yok");
}
if (!pkg.includes('"verify:yukselendustriyel-araba-kilit"')) {
  fail("package.json: verify:yukselendustriyel-araba-kilit yok");
}

const araba = JSON.parse(read("public/data/dept/araba.json"));
const tasima = JSON.parse(read("public/data/dept/tasima.json"));

const arabaAvatherm = araba.filter(isAvathermRow);
if (arabaAvatherm.length) {
  fail(`araba.json: ${arabaAvatherm.length} AVATHERM satırı kalmış`);
}

const tasimaAraba = araba.filter((r) => r.category === "tasima-arabalari");
if (tasimaAraba.length < MIN_TASIMA_ARABALARI) {
  fail(`araba.json: tasima-arabalari ${tasimaAraba.length} (< ${MIN_TASIMA_ARABALARI})`);
}

const tasimaAvatherm = tasima.filter(isAvathermRow);
if (tasimaAvatherm.length < MIN_AVATHERM_TASIMA) {
  fail(`tasima.json: AVATHERM ${tasimaAvatherm.length} (< ${MIN_AVATHERM_TASIMA})`);
}
for (const row of tasimaAvatherm) {
  if (row.dept !== "tasima") fail(`tasima.json: ${row.sku} dept≠tasima`);
  if (row.category === "avatherm") fail(`tasima.json: ${row.sku} category=avatherm (eski)`);
}

const servis = JSON.parse(read("public/data/dept/servis.json"));
const servisAvatherm = servis.filter(isAvathermRow);
if (servisAvatherm.length) {
  fail(`servis.json: ${servisAvatherm.length} AVATHERM satırı kalmış`);
}

if (err) {
  console.error("[verify-yukselendustriyel-araba-kilit] Kilit ihlali");
  process.exit(1);
}
console.log(
  `[verify-yukselendustriyel-araba-kilit] OK — ${tasimaAraba.length} taşıma arabası · ${tasimaAvatherm.length} AVATHERM tasima`,
);
