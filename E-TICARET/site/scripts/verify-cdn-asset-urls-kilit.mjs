/**
 * Faz B CDN görsel kilidi — deploy öncesi.
 * Kilit: public/cdn-asset-urls-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mustExistOrCdn } from "./lib/must-exist-or-cdn.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://dqb0g8etbedva.cloudfront.net";
let err = 0;

function fail(msg) {
  console.error("[verify-cdn-asset-urls-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/cdn-asset-urls-KILIT.txt");
mustExist("lib/public-asset-url.ts");

const kilit = read("public/cdn-asset-urls-KILIT.txt");
if (!kilit.includes("8e238a05")) fail("cdn-asset-urls-KILIT.txt: onay commit referansı yok");
if (!kilit.includes(CDN)) fail("cdn-asset-urls-KILIT.txt: CloudFront kök yok");

const publicAsset = read("lib/public-asset-url.ts");
if (!publicAsset.includes("KİLİT: public/cdn-asset-urls-KILIT.txt")) {
  fail("public-asset-url.ts: kilit yorumu yok");
}
if (!publicAsset.includes(`DEFAULT_CDN = "${CDN}"`)) {
  fail("public-asset-url.ts: DEFAULT_CDN değişmiş");
}
if (!publicAsset.includes("export function publicAssetUrl")) {
  fail("public-asset-url.ts: publicAssetUrl export yok");
}

const nextCfg = read("next.config.ts");
if (!nextCfg.includes("cdnAssetFallbackRewrites")) {
  fail("next.config.ts: CDN fallback rewrite yok");
}
if (!nextCfg.includes("fallback: cdnBase")) {
  fail("next.config.ts: fallback rewrites bağlanmamış");
}

const cdnConfig = read("public/eq-asset-cdn-config.js");
if (!cdnConfig.includes(CDN)) fail("eq-asset-cdn-config.js: CloudFront URL yok");
if (cdnConfig.includes('__EQUSTO_ASSET_CDN=""')) {
  fail("eq-asset-cdn-config.js: boş CDN (Faz B kırılır)");
}

const plp = read("public/eq-dept-plp.js");
if (!plp.includes("if (imgRel) imgOut = imgSrc(imgRel)")) {
  fail("eq-dept-plp.js: CDN/imgSrc önce ax-images yedek sırası bozulmuş");
}

const siteUrls = read("public/eq-site-urls.js");
if (!siteUrls.includes("DEFAULT_ASSET_CDN")) {
  fail("eq-site-urls.js: DEFAULT_ASSET_CDN fallback yok");
}
if (!siteUrls.includes("equstoCdnAssetHref(\"images/\" + file)")) {
  fail("eq-site-urls.js: catalogImageCandidates CDN önceliği yok");
}
if (!siteUrls.includes(CDN)) fail("eq-site-urls.js: CloudFront kök yok");

const homeComponents = [
  "components/home/HomeHeroAds.tsx",
  "components/home/HomeMainSlider.tsx",
  "components/home/HomeCafemarktBlock.tsx",
  "components/home/HomeCafemarktCategoriesSlider.tsx",
];
for (const rel of homeComponents) {
  const src = read(rel);
  if (!src.includes('from "@/lib/public-asset-url"')) {
    fail(`${rel}: public-asset-url import yok`);
  }
  if (!src.includes("publicAssetUrl(")) {
    fail(`${rel}: publicAssetUrl() kullanılmıyor`);
  }
}

const manifest = read("docs/s3-upload-manifest.json");
if (!manifest.includes(`"cdnEnvHint": "${CDN}"`)) {
  fail("s3-upload-manifest.json: cdnEnvHint değişmiş");
}

const sampleImages = [
  "public/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
  "public/images/home/hero-yer-sofrasi-bufe.png",
  "public/images/catalog/ozti/web/ozti-79e3-37nmv-03-cutout.png",
];
for (const rel of sampleImages) {
  await mustExistOrCdn(siteDir, rel, fail, "[verify-cdn-asset-urls-kilit]");
}

if (err) {
  console.error("[verify-cdn-asset-urls-kilit] Kilit ihlali — public/cdn-asset-urls-KILIT.txt");
  process.exit(1);
}
console.log("[verify-cdn-asset-urls-kilit] OK — CloudFront URL + rewrite + vitrin publicAssetUrl");
