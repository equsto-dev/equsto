/**
 * Advanced Cuisine scrape → public/images/imt300 + public/data/imt300-product.json
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = path.join(root, "external/advanced-cuisine-site/api/products.json");
const outDir = path.join(root, "public/images/imt300");
const dataPath = path.join(root, "public/data/imt300-product.json");
const clearIceDir = path.join(root, "public/data/advanced-cuisine-clear-ice");

function extFromUrl(url) {
  const m = String(url).match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? "." + m[1].toLowerCase().replace("jpeg", "jpg") : ".jpg";
}

function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  execFileSync(curl, ["-L", "-s", "-f", "-o", dest, url], { stdio: "pipe" });
  return fs.statSync(dest).size;
}

const raw = JSON.parse(fs.readFileSync(apiPath, "utf8"));
const products = Array.isArray(raw.products) ? raw.products : raw;
const p = products.find((x) => x && x.handle === "imt300-clear-ice-machine");
if (!p) {
  console.error("[imt300:sync] imt300-clear-ice-machine bulunamadı:", apiPath);
  process.exit(1);
}

const images = (p.images || [])
  .slice()
  .sort((a, b) => (a.position || 0) - (b.position || 0));

fs.mkdirSync(outDir, { recursive: true });
const localImages = [];

for (let i = 0; i < images.length; i++) {
  const src = images[i].src;
  const ext = extFromUrl(src);
  const name = `imt300-${i + 1}${ext}`;
  const dest = path.join(outDir, name);
  const bytes = download(src, dest);
  localImages.push({ position: i + 1, file: `/images/imt300/${name}`, src, bytes });
  console.log(`[imt300:sync] ${name} (${bytes} B)`);
}

const payload = {
  syncedAt: new Date().toISOString(),
  source: "advanced-cuisine.com",
  handle: p.handle,
  title: "Skyra IMT300 Berrak Buz Makinesi",
  titleEn: p.title,
  vendor: p.vendor,
  brand: "Skyra",
  descriptionTr:
    "Kesim gerektirmeden, standart formlarda parti halinde berrak buz üreten ticari ünite. Bar, otel ve restoranlar için yerinde üretim.",
  descriptionEn: (p.body_html || "").replace(/<[^>]+>/g, " ").trim(),
  equstoPriceHint: "11.500 € · teklif için iletişim",
  shopifyPriceUsd: p.variants?.[0]?.price || null,
  productPage: "/imt300",
  images: localImages,
  formats: [
    { id: "cube", label: "Küp", count: 60, size: "55 mm" },
    { id: "sphere-lg", label: "Büyük küre", count: 32, size: "Ø75 mm" },
    { id: "sphere-sm", label: "Küçük küre", count: 50, size: "Ø60 mm" },
    { id: "stick", label: "Çubuk", count: 48, size: "38×38×102 mm" },
    { id: "diamond", label: "Elmas", count: 60, size: "Ø60×55 mm" },
  ],
  specs: {
    model: "Skyra IMT300 (çift tepsi)",
    power: "220–240 V 50 Hz · üretim 650 W · ayırma 1400 W",
    dimensionsOuter: "870 × 755 × 856 mm",
    dimensionsInner: "750 × 382 × 452 mm",
    weight: "110–117 kg",
  },
};

fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2), "utf8");
console.log("[imt300:sync] →", dataPath);

fs.mkdirSync(clearIceDir, { recursive: true });
const subset = {
  products: products.filter((x) =>
    /imt\d+-clear-ice-machine/i.test(x?.handle || "")
  ),
};
fs.writeFileSync(
  path.join(clearIceDir, "products.json"),
  JSON.stringify(subset, null, 2),
  "utf8"
);
console.log("[imt300:sync] →", path.join(clearIceDir, "products.json"));
