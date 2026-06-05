/**
 * Ana sayfa Popüler Kategoriler şeridi kilit doğrulama.
 * Kilit: public/home-pop-cats-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-home-pop-cats-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/home-pop-cats-KILIT.txt");
mustExist("components/home/HomeCafemarktCategoriesSlider.tsx");
mustExist("components/home/HomeCafemarktBlock.tsx");
mustExist("lib/home-cafemarkt-content.ts");
mustExist("public/eq-home-cafemarkt.css");

const kilit = read("public/home-pop-cats-KILIT.txt");
if (!kilit.includes("59b49858")) fail("home-pop-cats-KILIT.txt: onay commit referansı yok");
if (!kilit.includes("width: 98%")) fail("home-pop-cats-KILIT.txt: çerçeve %98 kilidi yok");
if (!kilit.includes("gap: 12px")) fail("home-pop-cats-KILIT.txt: gap 12px kilidi yok");

const css = read("public/eq-home-cafemarkt.css");
if (!css.includes("/* KİLİT: public/home-pop-cats-KILIT.txt */")) {
  fail("eq-home-cafemarkt.css: pop-cats kilit yorumu yok");
}

const catsBlock = css.slice(
  css.indexOf("/* ── Popüler kategoriler ── */"),
  css.indexOf("/* ── Bento grid"),
);
if (!catsBlock.includes("gap: 12px")) fail("eq-home-cafemarkt.css: cats viewport gap 12px değil");
if (!catsBlock.includes("width: 98%")) fail("eq-home-cafemarkt.css: img-wrap width 98% değil");
if (!catsBlock.includes("border: 1px solid #001e50")) {
  fail("eq-home-cafemarkt.css: kategori çerçeve border yok");
}
if (!catsBlock.includes("aspect-ratio: 1")) fail("eq-home-cafemarkt.css: kare aspect-ratio yok");
if (!catsBlock.includes("object-fit: contain")) fail("eq-home-cafemarkt.css: cat img contain yok");
if (!catsBlock.includes("object-position: center center")) {
  fail("eq-home-cafemarkt.css: cat img center yok");
}
if (!catsBlock.includes("calc((100% - 48px) / 5)")) {
  fail("eq-home-cafemarkt.css: masaüstü 5 sütun kilidi yok");
}
if (!catsBlock.includes("calc((100% - 24px) / 3)")) {
  fail("eq-home-cafemarkt.css: tablet 3 sütun kilidi yok");
}
if (!catsBlock.includes("calc((100% - 12px) / 2)")) {
  fail("eq-home-cafemarkt.css: mobil 2 sütun kilidi yok");
}

const slider = read("components/home/HomeCafemarktCategoriesSlider.tsx");
if (!slider.includes('from "@/lib/public-asset-url"')) {
  fail("CategoriesSlider: public-asset-url import yok (cdn-asset-urls-KILIT)");
}
if (!slider.includes("publicAssetUrl(")) {
  fail("CategoriesSlider: publicAssetUrl() kullanılmıyor");
}
if (!slider.includes("const AUTO_MS = 5500")) fail("CategoriesSlider: AUTO_MS 5500 değil");
if (!slider.includes("const CAT_GAP_PX = 12")) fail("CategoriesSlider: CAT_GAP_PX 12 değil");
if (!slider.includes("if (w <= 640) return 2")) fail("CategoriesSlider: mobil perPage 2 yok");
if (!slider.includes("if (w <= 1100) return 3")) fail("CategoriesSlider: tablet perPage 3 yok");
if (!slider.includes("return 5")) fail("CategoriesSlider: masaüstü perPage 5 yok");
if (!slider.includes("eq-cmkt-cats-wrap")) fail("CategoriesSlider: wrap sınıfı yok");
if (!slider.includes("Popüler Kategoriler")) fail("CategoriesSlider: başlık metni yok");
if (!slider.includes("eq-cmkt-cat__img-wrap--bar-white")) {
  fail("CategoriesSlider: bar-white sınıfı yok");
}

const block = read("components/home/HomeCafemarktBlock.tsx");
if (!block.includes("HomeCafemarktCategoriesSlider")) {
  fail("HomeCafemarktBlock.tsx: categories slider yok");
}
if (!block.includes("cafemarktCategories")) fail("HomeCafemarktBlock.tsx: cafemarktCategories yok");

const content = read("lib/home-cafemarkt-content.ts");
if (!content.includes("export const cafemarktCategories")) {
  fail("home-cafemarkt-content.ts: cafemarktCategories export yok");
}
if (!content.includes('id: "cay"')) fail("home-cafemarkt-content.ts: çay kategorisi yok");
if (!content.includes('id: "soguk-teshir"')) {
  fail("home-cafemarkt-content.ts: soğuk teşhir kategorisi yok");
}
if (!content.includes('id: "bar-blender"')) fail("home-cafemarkt-content.ts: bar blender yok");
if (!content.includes('id: "pizza"')) fail("home-cafemarkt-content.ts: pizza fırını yok");
if (!content.includes('id: "filtre-kahve"')) fail("home-cafemarkt-content.ts: filtre kahve yok");
if (!content.includes("hero-bar-cocktailstation-popcat-white.png")) {
  fail("home-cafemarkt-content.ts: Bar Design beyaz popcat yolu değişmiş");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes("export const SHOP_ASSET_V")) fail("assets.ts: SHOP_ASSET_V yok");

if (err) {
  console.error("[verify-home-pop-cats-kilit] Kilit ihlali");
  process.exit(1);
}
console.log("[verify-home-pop-cats-kilit] OK — 5/3/2 carousel · çerçeve %98 · contain center");
