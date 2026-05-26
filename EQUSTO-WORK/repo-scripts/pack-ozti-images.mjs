/**
 * Güncellenmiş Öztiryakiler görselleri → equsto-ozti-images.zip
 * public/data/images içinden rapordaki hedef dosyaları paketler.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "public", "data", "ozti-image-import-report.json");
const imagesDir = path.join(root, "public", "data", "images");
const stage = path.join(root, ".ozti-images-stage");
const outZip = path.join(root, "equsto-ozti-images.zip");

if (!fs.existsSync(reportPath)) {
  console.error("[pack-ozti] Önce: npm run ozti:import-images");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const destNames = new Set();
for (const m of report.matched || []) {
  /* matched entries don't list dest — scan ekipmanlar for ozti */
}
const site = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "ekipmanlar.json"), "utf8"));
for (const p of site) {
  if (!/öztiryakiler/i.test(p.brand || "")) continue;
  for (const im of p.images || []) {
    const b = im.replace(/\\/g, "/").split("/").pop();
    if (b) destNames.add(b);
  }
}

if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
const imgStage = path.join(stage, "images");
fs.mkdirSync(imgStage, { recursive: true });

let n = 0;
for (const name of destNames) {
  const src = path.join(imagesDir, name);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(imgStage, name));
  n++;
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const seven = [
  "C:\\Program Files\\7-Zip\\7z.exe",
  "C:\\Program Files (x86)\\7-Zip\\7z.exe",
].find((p) => fs.existsSync(p));
if (seven) {
  execSync(`"${seven}" a -tzip "${outZip}" "${path.join(stage, "*")}"`, { stdio: "inherit" });
} else {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(stage, "images").replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
}
fs.rmSync(stage, { recursive: true, force: true });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(1);
console.log(`[pack-ozti] ${outZip} (${mb} MB, ${n} dosya)`);
console.log("[pack-ozti] cPanel → public_html → Extract → data/images/ klasörüne yazılır");
