/**
 * Ana sayfa Cafemarkt hero kutuları kilit doğrulama.
 * Kilit: public/home-cafemarkt-hero-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-home-cafemarkt-hero-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/home-cafemarkt-hero-KILIT.txt");
mustExist("components/home/HomeCafemarktBlock.tsx");
mustExist("components/home/HomeCafemarktMount.tsx");
mustExist("lib/home-cafemarkt-content.ts");
mustExist("public/eq-home-cafemarkt.css");

const kilit = read("public/home-cafemarkt-hero-KILIT.txt");
if (!kilit.includes("96707dd3")) fail("home-cafemarkt-hero-KILIT.txt: onay commit referansı yok");
if (!kilit.includes("clamp(168px, 17.28vw, 372px)")) {
  fail("home-cafemarkt-hero-KILIT.txt: --cmkt-hero-h kilidi yok");
}
if (kilit.includes("revizyon açık") && kilit.includes("hero kutuları")) {
  fail("home-cafemarkt-hero-KILIT.txt: hero revizyon açık notu olmamalı");
}
if (!kilit.includes("transform scale YOK")) {
  fail("home-cafemarkt-hero-KILIT.txt: buzdolabı scale yasağı yok");
}

const css = read("public/eq-home-cafemarkt.css");
if (!css.includes("/* KİLİT: public/home-cafemarkt-hero-KILIT.txt */")) {
  fail("eq-home-cafemarkt.css: hero kilit yorumu yok");
}
if (!css.includes("--cmkt-hero-h: clamp(168px, 17.28vw, 372px)")) {
  fail("eq-home-cafemarkt.css: --cmkt-hero-h değişmiş");
}
if (!css.includes("grid-template-columns: minmax(0, 14fr) minmax(0, 6fr)")) {
  fail("eq-home-cafemarkt.css: 14fr/6fr sütun kilidi yok");
}
if (!css.includes("grid-template-rows: minmax(0, 1fr) minmax(0, 1fr)")) {
  fail("eq-home-cafemarkt.css: 2 satır grid kilidi yok");
}
const heroGridBlock = css.slice(
  css.indexOf(".eq-cmkt-hero-grid"),
  css.indexOf(".eq-cmkt-promo {"),
);
if (!heroGridBlock.includes("gap: 6px")) fail("eq-home-cafemarkt.css: hero gap 6px değil");
if (!heroGridBlock.includes("margin-bottom: 17px")) {
  fail("eq-home-cafemarkt.css: hero margin-bottom 17px değil");
}
if (!css.includes("grid-row: 1 / span 2")) {
  fail("eq-home-cafemarkt.css: sol kutu span 2 kilidi yok");
}
if (!/\.eq-cmkt-hero-side\s*\{\s*display:\s*contents;\s*\}/.test(css)) {
  fail("eq-home-cafemarkt.css: hero-side display: contents yok");
}
if (!css.includes("grid-template-columns: minmax(0, 2fr) minmax(0, 3fr)")) {
  fail("eq-home-cafemarkt.css: split 2fr/3fr kilidi yok");
}
if (!css.includes("justify-content: flex-start")) {
  fail("eq-home-cafemarkt.css: split panel flex-start yok");
}

const splitImgIdx = css.indexOf(".eq-cmkt-promo--split .eq-cmkt-promo__media-img {");
const mobileIdx = css.indexOf("@media", splitImgIdx);
const desktopSplitImg =
  mobileIdx > splitImgIdx ? css.slice(splitImgIdx, mobileIdx) : css.slice(splitImgIdx);
if (!desktopSplitImg.includes("object-fit: contain")) {
  fail("eq-home-cafemarkt.css: split media contain yok");
}
if (desktopSplitImg.includes("transform:") && desktopSplitImg.includes("scale")) {
  fail("eq-home-cafemarkt.css: masaüstü split img transform scale var");
}

const block = read("components/home/HomeCafemarktBlock.tsx");
if (!block.includes("eq-cmkt-hero-grid")) fail("HomeCafemarktBlock.tsx: hero grid yok");
if (!block.includes("eq-cmkt-hero-side")) fail("HomeCafemarktBlock.tsx: hero side yok");
if (!block.includes("eq-cmkt-promo--main")) fail("HomeCafemarktBlock.tsx: main promo yok");
if (!block.includes("eq-cmkt-promo--compact")) fail("HomeCafemarktBlock.tsx: compact promo yok");
if (!block.includes("eq-cmkt-promo--wide")) fail("HomeCafemarktBlock.tsx: wide ocak promo yok");
if (!block.includes("SplitPromoCard")) fail("HomeCafemarktBlock.tsx: SplitPromoCard yok");
if (!block.includes("cafemarktHeroSideTop")) fail("HomeCafemarktBlock.tsx: side top map yok");
if (!block.includes("cafemarktHeroSideBottom")) fail("HomeCafemarktBlock.tsx: side bottom yok");

const mount = read("components/home/HomeCafemarktMount.tsx");
if (!mount.includes("eq-home-cafemarkt-mount")) fail("HomeCafemarktMount.tsx: mount id yok");
if (!mount.includes("eq-home-cafemarkt-on")) fail("HomeCafemarktMount.tsx: body sınıfı yok");

const portals = read("components/home/HomeVitrinPortals.tsx");
if (!portals.includes("HomeCafemarktMount")) fail("HomeVitrinPortals.tsx: cafemarkt mount yok");

const content = read("lib/home-cafemarkt-content.ts");
if (!content.includes('layout: "split"')) fail("home-cafemarkt-content.ts: split layout yok");
if (!content.includes("ozti-79e3-37nmv-03-cutout.png")) {
  fail("home-cafemarkt-content.ts: buzdolabı cutout yolu değişmiş");
}
if (!content.includes('id: "kahve"')) fail("home-cafemarkt-content.ts: kahve kartı yok");
if (!content.includes('id: "yikama"')) fail("home-cafemarkt-content.ts: yikama kartı yok");
if (!content.includes('id: "pisirme-ocak"')) fail("home-cafemarkt-content.ts: ocak kartı yok");

const indexBody = read("lib/vitrin/bodies/index.ts");
if (!indexBody.includes("eq-home-cafemarkt-mount")) {
  fail("index.ts: eq-home-cafemarkt-mount yok");
}
if (indexBody.includes("Profesyonel mutfağınızı birlikte planlayalım")) {
  fail("index.ts: alt CTA bandı geri gelmiş");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes("export const SHOP_ASSET_V")) {
  fail("assets.ts: SHOP_ASSET_V yok");
}

if (err) {
  console.error("[verify-home-cafemarkt-hero-kilit] Kilit ihlali");
  process.exit(1);
}
console.log(
  "[verify-home-cafemarkt-hero-kilit] OK — 14/6 grid · span-2 sol · %60 yükseklik · split contain",
);
