/**
 * file:// için public/data/ekipmanlar-file-fallback.js üretir.
 *
 * Kaynak: public/data/ekipmanlar.json (tam liste).
 * Çıktı çok satırlı JSON (tek satır megabyte dosyalarından kaçınılır).
 *
 * Varsayılan: tüm kayıtlar. İsteğe bağlı örnek: npm run data:fallback -- --sample
 *
 * Katalog güncellendikten sonra: npm run data:fallback
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public", "data", "ekipmanlar.json");
const out = path.join(root, "public", "data", "ekipmanlar-file-fallback.js");

const SAMPLE = process.argv.includes("--sample");

/** --sample: vitrin slug'larından kategori başına sınırlı örnek (eski davranış) */
const TARGET_SLUGS = [
  "sogutma-ekipmanlari",
  "bulasik-makineleri",
  "kahve-makineleri",
  "hamur-hazirlik-makineleri",
  "et-hazirlik-makineleri",
  "cay-kazanlari-cay-makineleri-cay-otomatlari",
  "yiyecek-ve-icecek-otomatlari-",
  "sanayi-ocaklari",
  "sanayi-tipi-izgaralar",
  "kuzineler",
  "fritozler",
  "doner-ocaklari-",
  "tost-makineleri",
  "pilic-cevirme-makineleri",
  "ocakbasi-izgara",
];

const PER_CAT = 32;

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const arr = Array.isArray(raw) ? raw : raw?.items || [];

let slice;
if (SAMPLE) {
  const counts = Object.fromEntries(TARGET_SLUGS.map((s) => [s, 0]));
  slice = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const c = item && item.category;
    if (!c || counts[c] === undefined) continue;
    if (counts[c] >= PER_CAT) continue;
    counts[c]++;
    slice.push(item);
  }
  const filled = TARGET_SLUGS.filter((s) => counts[s] > 0).length;
  console.log(`--sample: ${slice.length} ürün (${filled}/${TARGET_SLUGS.length} slug grubu)`);
  for (const s of TARGET_SLUGS) {
    if (counts[s] === 0) console.warn(`  (uyarı) katalogda ürün yok: ${s}`);
  }
} else {
  slice = arr.slice();
  console.log(`Tam katalog: ${slice.length} ürün`);
}

const banner =
  "/**\n * Otomatik üretildi — elle düzenlemeyin. Kaynak: ekipmanlar.json\n * Yenile: npm run data:fallback\n */\n";
const body = `${banner}window.__EQUSTO_EKIPMANLAR_FILE=${JSON.stringify(slice, null, 2)};\n`;
fs.writeFileSync(out, body, "utf8");
const st = fs.statSync(out);
console.log(`Yazıldı: ${out} (${Math.round(st.size / 1024)} KB)`);
