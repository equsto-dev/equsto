/**
 * Hızlı mobil düzeltme ZIP — yalnızca theme/contact/nav JS+CSS + index.html
 * cPanel: public_html köküne Extract (üzerine yazar).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-mobil-patch.zip");
const stage = path.join(root, ".mobil-patch-stage");

const FILES = [
  "theme.css",
  "contact.css",
  "nav.js",
  "contact.js",
  "equsto-logo.js",
  "eq-dept-tips.js",
  "eq-category-shell.js",
  "eq-dept-seo.js",
  "index.html",
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

for (const f of FILES) {
  const src = path.join(dist, f);
  if (!fs.existsSync(src)) {
    console.error("[mobil-patch] Eksik:", src, "— önce npm run build");
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stage, f));
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[mobil-patch] Hazir:", outZip);
console.log("[mobil-patch] Boyut:", mb, "MB");
console.log("[mobil-patch] Dosyalar:", FILES.join(", "));
rmrf(stage);
