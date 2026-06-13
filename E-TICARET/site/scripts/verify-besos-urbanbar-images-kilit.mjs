/**
 * Deploy öncesi Besos Urban Bar görsel kilidi (Shopify CDN).
 * Kilit: public/besos-urbanbar-images-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT_REF = "399d3de6";
const SAMPLE_HANDLE = "alto-cocktail-17cl-copy";
const SAMPLE_URLS = [
  "https://cdn.shopify.com/s/files/1/0467/5066/2816/files/UB6979.jpg?v=1741890217",
  "https://cdn.shopify.com/s/files/1/0467/5066/2816/files/UB6979_904b25a7-7605-43cc-9609-45f8c06f7379.png?v=1741890217",
];
let err = 0;

function fail(msg) {
  console.error("[verify-besos-urbanbar-images-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/besos-urbanbar-images-KILIT.txt");

const kilit = read("public/besos-urbanbar-images-KILIT.txt");
if (!kilit.includes(COMMIT_REF)) fail("besos-urbanbar-images-KILIT.txt: commit referansı yok");
if (!kilit.includes("alto-cocktail-17cl-copy")) fail("KILIT: referans ürün eksik");

const gallery = read("lib/besos/urbanbar/gallery-images.ts");
if (!gallery.includes("KİLİT: public/besos-urbanbar-images-KILIT.txt")) {
  fail("gallery-images.ts: kilit yorumu yok");
}
if (!gallery.includes("isUrbanBarLocalCatalogPath")) fail("gallery-images.ts: isUrbanBarLocalCatalogPath yok");
if (!gallery.includes("resolveUrbanBarGalleryImages")) fail("gallery-images.ts: resolveUrbanBarGalleryImages yok");

const build = read("scripts/build-urbanbar-besos-catalog.mjs");
if (!build.includes("KİLİT: public/besos-urbanbar-images-KILIT.txt")) {
  fail("build-urbanbar-besos-catalog.mjs: kilit yorumu yok");
}
if (!build.includes("function localCatalogImageExists")) {
  fail("build-urbanbar-besos-catalog.mjs: localCatalogImageExists yok");
}
if (!/if \(web\?\.images\?\.length\)[\s\S]{0,400}else \{[\s\S]{0,200}localCatalogImageExists/.test(build)) {
  fail("build-urbanbar-besos-catalog.mjs: Shopify-öncelikli imageUrls dalı bozulmuş");
}
if (/for \(const rel of row\.images \|\| \[\]\) \{[\s\S]*imageUrls\.push\(rel\)/.test(build)) {
  const afterWeb = build.split("if (web?.images?.length)")[1];
  if (afterWeb && /for \(const rel of row\.images/.test(afterWeb.split("} else {")[0] || "")) {
    // ok — only in else branch
  } else if (/for \(const rel of row\.images[\s\S]*?imageUrls\.push\(rel\)/.test(build.replace(/} else \{[\s\S]*?\n  \}/, ""))) {
    fail("build-urbanbar-besos-catalog.mjs: web.images sonrası row.images birleştirmesi geri gelmiş");
  }
}

const pdp = read("components/besos/urbanbar/BesosUrbanBarPdp.tsx");
if (!pdp.includes("resolveUrbanBarGalleryImages")) fail("BesosUrbanBarPdp.tsx: gallery resolver yok");

const plp = read("lib/besos/urbanbar/plp-images.ts");
if (!plp.includes("isUrbanBarLocalCatalogPath")) fail("plp-images.ts: yerel urbanbar filtresi yok");

const pdpGallery = read("components/besos/urbanbar/BesosUrbanBarPdpGallery.tsx");
if (!pdpGallery.includes("referrerPolicy")) fail("BesosUrbanBarPdpGallery.tsx: Shopify referrerPolicy yok");
if (!pdpGallery.includes("dropBroken")) fail("BesosUrbanBarPdpGallery.tsx: kırık görsel atma yok");

const catalog = JSON.parse(read("public/data/urbanbar-besos-catalog.json"));

function walkProducts(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const x of node) walkProducts(x, out);
    return out;
  }
  if (typeof node === "object") {
    if (node.handle && Array.isArray(node.imageUrls)) out.push(node);
    for (const v of Object.values(node)) walkProducts(v, out);
  }
  return out;
}

const products = walkProducts(catalog);
if (products.length < 900) fail(`urbanbar-besos-catalog.json: beklenen ~927 ürün, bulunan ${products.length}`);

const withLocal = products.filter((p) =>
  (p.imageUrls || []).some((u) => /(^|\/)images\/catalog\/urbanbar\//i.test(String(u))),
);
if (withLocal.length) {
  fail(
    `urbanbar-besos-catalog.json: ${withLocal.length} üründe yerel urbanbar yolu var (ör. ${withLocal[0]?.handle})`,
  );
}

const sample = products.find((p) => p.handle === SAMPLE_HANDLE);
if (!sample) fail(`urbanbar-besos-catalog.json: ${SAMPLE_HANDLE} yok`);
for (const url of SAMPLE_URLS) {
  if (!sample.imageUrls.includes(url)) fail(`${SAMPLE_HANDLE}: eksik Shopify URL`);
}
if (sample.imageUrls.length !== SAMPLE_URLS.length) {
  fail(`${SAMPLE_HANDLE}: imageUrls=${sample.imageUrls.length}, beklenen ${SAMPLE_URLS.length}`);
}

if (err) {
  console.error("[verify-besos-urbanbar-images-kilit] Kilit ihlali — public/besos-urbanbar-images-KILIT.txt");
  process.exit(1);
}
console.log("[verify-besos-urbanbar-images-kilit] OK — Urban Bar Shopify CDN görsel kilidi");
