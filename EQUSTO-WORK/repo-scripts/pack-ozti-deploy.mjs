/**
 * Öztiryakiler görsel güncellemesi + katalog JSON → tek ZIP (cPanel).
 * İçerik: data/ekipmanlar.json + data/images/ (Öztiryakiler görselleri)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(root, "public", "data", "images");
const ekipmanlar = path.join(root, "public", "data", "ekipmanlar.json");
const stage = path.join(root, ".ozti-deploy-stage");
const outZip = path.join(root, "equsto-ozti-json-images.zip");

const DATA_JSON = ["ekipmanlar.json"];

if (!fs.existsSync(ekipmanlar)) {
  console.error("[pack-ozti-deploy] public/data/ekipmanlar.json yok");
  process.exit(1);
}

const site = JSON.parse(fs.readFileSync(ekipmanlar, "utf8"));
const destNames = new Set();
for (const p of site) {
  if (!/öztiryakiler/i.test(p.brand || "")) continue;
  if (!/öztiryakiler/i.test(p.name || "")) continue;
  for (const im of p.images || []) {
    const b = String(im).replace(/\\/g, "/").split("/").pop();
    if (b) destNames.add(b);
  }
}

if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
const dataStage = path.join(stage, "data");
const imgStage = path.join(dataStage, "images");
fs.mkdirSync(imgStage, { recursive: true });

for (const j of DATA_JSON) {
  const src = path.join(root, "public", "data", j);
  if (!fs.existsSync(src)) {
    console.error("[pack-ozti-deploy] Eksik:", src);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(dataStage, j));
}

let imgCount = 0;
for (const name of destNames) {
  const src = path.join(imagesDir, name);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(imgStage, name));
  imgCount++;
}

const seven = [
  "C:\\Program Files\\7-Zip\\7z.exe",
  "C:\\Program Files (x86)\\7-Zip\\7z.exe",
].find((p) => fs.existsSync(p));
if (!fs.existsSync(seven)) {
  console.error("[pack-ozti-deploy] 7-Zip gerekli");
  process.exit(1);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(`"${seven}" a -tzip "${outZip}" "${stage}\\*"`, { stdio: "inherit", cwd: root });
fs.rmSync(stage, { recursive: true, force: true });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(1);
console.log(`\n[pack-ozti-deploy] ${outZip}`);
console.log(`  JSON: ${DATA_JSON.join(", ")}`);
console.log(`  Görsel: ${imgCount} dosya`);
console.log(`  Boyut: ${mb} MB`);
console.log("[pack-ozti-deploy] cPanel → public_html → Extract (data/ klasörü köke oturur)");
