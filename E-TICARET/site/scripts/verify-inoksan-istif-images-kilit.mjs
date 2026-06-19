/**
 * Deploy öncesi İnoksan istif rafı görsel kilidi.
 * Kilit: public/inoksan-istif-images-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mustExistOrCdn } from "./lib/must-exist-or-cdn.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOP_ASSET_V = "20260619-kdv-dahil-arama-v2";
const EQ_CATALOG_IMG_V = "20260613-tezgah-buz-3k-v1";
const ISTIF_V2 = [
  "images/catalog/inoksan/web/istif-v2/ino-idd.jpg",
  "images/catalog/inoksan/web/istif-v2/ino-idk.jpg",
  "images/catalog/inoksan/web/istif-v2/ino-idp.jpg",
];
let err = 0;

function fail(msg) {
  console.error("[verify-inoksan-istif-images-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/inoksan-istif-images-KILIT.txt");

const kilit = read("public/inoksan-istif-images-KILIT.txt");
if (!kilit.includes("97080efd")) fail("inoksan-istif-images-KILIT.txt: commit referansı yok");
if (!kilit.includes("istif-v2/ino-idd.jpg")) fail("KILIT: IDD yolu eksik");
if (!kilit.includes(EQ_CATALOG_IMG_V)) fail("KILIT: EQ_CATALOG_IMG_V eksik");

const enrich = read("scripts/lib/inoksan-enrich.mjs");
if (!enrich.includes("KİLİT: public/inoksan-istif-images-KILIT.txt")) {
  fail("inoksan-enrich.mjs: kilit yorumu yok");
}
if (!enrich.includes("function istifSeriesKey")) fail("inoksan-enrich.mjs: istifSeriesKey yok");
if (!enrich.includes("istif-v2/ino-")) {
  fail("inoksan-enrich.mjs: istif-v2 görsel yolu yok");
}
if (!/\[\s*\/\^IDD\/i,\s*"idd"\s*\]/.test(enrich)) {
  fail("inoksan-enrich.mjs: IDD→idd alias yok");
}
if (!/\[\s*\/\^IDK\/i,\s*"idk"\s*\]/.test(enrich)) {
  fail("inoksan-enrich.mjs: IDK→idk alias yok");
}
if (!/\[\s*\/\^IDP\/i,\s*"idp"\s*\]/.test(enrich)) {
  fail("inoksan-enrich.mjs: IDP→idp alias yok");
}
if (/\[\s*\/\^(IDD|IDK|IDP)\/i,\s*"fka011i"\s*\]/.test(enrich)) {
  fail("inoksan-enrich.mjs: IDD/IDK/IDP → fka011i yasak alias geri gelmiş");
}
if (!enrich.includes('idd: "10633"') || !enrich.includes('idk: "10635"') || !enrich.includes('idp: "10634"')) {
  fail("inoksan-enrich.mjs: WEB_INDEX_ALIASES idd/idk/idp eksik");
}
if (enrich.includes("FKA011I-FKA021I-TEPSI-ISTIF")) {
  fail("inoksan-enrich.mjs: tepsi istif DEPT_FALLBACK geri gelmiş");
}

const siteUrls = read("public/eq-site-urls.js");
if (!siteUrls.includes(`EQ_CATALOG_IMG_V = "${EQ_CATALOG_IMG_V}"`)) {
  fail(`eq-site-urls.js: EQ_CATALOG_IMG_V=${EQ_CATALOG_IMG_V} değil`);
}
if (!siteUrls.includes("inoksan\\/(?:web\\/|web\\/istif-v2\\/)")) {
  fail("eq-site-urls.js: withCatalogImgV inoksan/istif-v2 regex yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes(`SHOP_ASSET_V = "${SHOP_ASSET_V}"`)) {
  fail(`assets.ts: SHOP_ASSET_V=${SHOP_ASSET_V} değil`);
}

const istif = JSON.parse(read("public/data/dept/istif.json"));
const inoRows = istif.filter((r) => /^INO-ID[DKP]/i.test(String(r.sku || "")));
if (inoRows.length !== 30) {
  fail(`istif.json: INO-ID* beklenen 30, bulunan ${inoRows.length}`);
}
const bad = inoRows.filter((r) => !/^images\/catalog\/inoksan\/web\/istif-v2\/ino-id[dkp]\.jpg$/i.test(String(r.images?.[0] || "")));
if (bad.length) {
  fail(`istif.json: ${bad.length} satır istif-v2 dışı görsel (${bad[0]?.sku})`);
}
const perSku = inoRows.filter((r) => /\/ino-id[dkp]\d+\.jpg/i.test(String(r.images?.[0] || "")));
if (perSku.length) {
  fail("istif.json: per-SKU ino-id*084.jpg yolu yasak — immutable önbellek");
}

for (const rel of ISTIF_V2) {
  await mustExistOrCdn(siteDir, rel, fail, "[verify-inoksan-istif-images-kilit]");
}

if (err) {
  console.error("[verify-inoksan-istif-images-kilit] Kilit ihlali — public/inoksan-istif-images-KILIT.txt");
  process.exit(1);
}
console.log("[verify-inoksan-istif-images-kilit] OK — İnoksan IDD/IDK/IDP istif-v2 görselleri");
