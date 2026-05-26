/**
 * Sunucuya atmadan önce yerel kontrol (çıkış 0 = hazır görünüyor)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let ok = true;

function pass(msg) {
  console.log("  ✓", msg);
}
function fail(msg) {
  console.log("  ✗", msg);
  ok = false;
}

console.log("[pre-deploy] Yerel dosya kontrolleri\n");

const imtDir = path.join(root, "public", "images", "imt300");
if (fs.existsSync(imtDir)) {
  const n = fs.readdirSync(imtDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).length;
  n >= 8 ? pass(`IMT300 görselleri: ${n} dosya`) : fail(`IMT300 görselleri eksik (${n}/8)`);
} else fail("public/images/imt300 yok — npm run imt300:sync");

const ekPath = path.join(root, "public", "data", "ekipmanlar.json");
if (fs.existsSync(ekPath)) {
  const raw = fs.readFileSync(ekPath, "utf8");
  raw.includes("equstoPage") && raw.includes("IMT300")
    ? pass("ekipmanlar.json içinde IMT300 kaydı")
    : fail("ekipmanlar.json — IMT300 / equstoPage yok (npm run imt300:ekipmanlar)");
} else fail("public/data/ekipmanlar.json yok");

const besos = path.join(root, "public", "bar-design.html");
if (fs.existsSync(besos)) {
  const h = fs.readFileSync(besos, "utf8");
  h.includes('href="/imt300"') && h.includes("Sayfaya Git")
    ? pass("bar-design.html hero → /imt300")
    : fail("bar-design.html hero CTA güncel değil");
  h.includes("renderSignatureBars")
    ? pass("bar-design.html renderSignatureBars tanımlı")
    : fail("bar-design.html — renderSignatureBars eksik (katalog kırılır)");
} else fail("public/bar-design.html yok");

const icecek = path.join(root, "public", "icecek.html");
if (fs.existsSync(icecek)) {
  const ic = fs.readFileSync(icecek, "utf8");
  ic.includes("icecek-berrak-buz-makineleri")
    ? pass("icecek.html — berrak buz kategorisi")
    : fail("icecek.html — IMT300 kategori/promo eksik");
} else fail("public/icecek.html yok");

const paketBesos = path.join(root, "bar-design", "EQUSTO-BAR-DESIGN-PAKET", "bar-design.html");
if (fs.existsSync(paketBesos)) {
  const pb = fs.readFileSync(paketBesos, "utf8");
  pb.includes('href="/imt300"')
    ? pass("EQUSTO-BAR-DESIGN-PAKET bar-design.html senkron")
    : fail("EQUSTO-BAR-DESIGN-PAKET eski — npm run bar-design:sync-paket");
}

const distTheme = path.join(root, "dist", "theme.js");
fs.existsSync(distTheme)
  ? pass("dist/theme.js var (önceki build)")
  : console.log("  · dist/theme.js yok — sunucu öncesi: npm run build");

const distEk = path.join(root, "dist", "data", "ekipmanlar.json");
if (fs.existsSync(distEk)) {
  const de = fs.readFileSync(distEk, "utf8");
  de.includes("IMT300") ? pass("dist/data/ekipmanlar.json güncel") : fail("dist ekipmanlar eski — npm run build");
}

const ht = path.join(root, "dist", ".htaccess");
fs.existsSync(ht) ? pass("dist/.htaccess") : console.log("  · dist/.htaccess yok — build sonrası oluşur");

console.log(
  ok
    ? "\n[pre-deploy] Yerel kaynak hazır görünüyor. Sunucu: dist içeriği + data/images (~GB) + .htaccess."
    : "\n[pre-deploy] Eksikler var — yukarıdaki ✗ maddeleri tamamlayın."
);
process.exit(ok ? 0 : 1);
