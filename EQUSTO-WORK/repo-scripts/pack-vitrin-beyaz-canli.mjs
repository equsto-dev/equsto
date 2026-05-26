/**
 * Hızlı canlı güncelleme: vitrin beyaz zemin kilidi (theme.css + theme.js).
 * cPanel: public_html köküne yükle (mevcut theme dosyalarının üzerine).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const outZip = path.join(root, "equsto-vitrin-beyaz-canli.zip");
const stage = path.join(root, ".deploy-stage-vitrin-beyaz");

const files = [
  { src: path.join(publicDir, "theme.css"), rel: "theme.css" },
  { src: path.join(publicDir, "theme.js"), rel: "theme.js" },
  { src: path.join(publicDir, "vitrin-beyaz-zemin-KILIT.txt"), rel: "vitrin-beyaz-zemin-KILIT.txt" },
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

for (const f of files) {
  if (!fs.existsSync(f.src)) {
    console.error("[pack] Eksik:", f.src);
    process.exit(1);
  }
  const dst = path.join(stage, f.rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(f.src, dst);
}

// dist/assets içindeki hash'li theme varsa da güncelle (vite build sonrası)
if (fs.existsSync(distDir)) {
  const assets = path.join(distDir, "assets");
  if (fs.existsSync(assets)) {
    for (const name of fs.readdirSync(assets)) {
      if (/^theme-.*\.css$/i.test(name)) {
        const ad = path.join(stage, "assets");
        fs.mkdirSync(ad, { recursive: true });
        fs.copyFileSync(path.join(assets, name), path.join(ad, name));
        console.log("[pack] dist asset:", name);
      }
    }
  }
  for (const name of ["theme.css", "theme.js"]) {
    const p = path.join(distDir, name);
    if (fs.existsSync(p)) {
      fs.copyFileSync(p, path.join(stage, name));
    }
  }
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack] Hazir:", outZip, `(${mb} MB)`);
console.log("[pack] Yukle: public_html/theme.css + theme.js (ve varsa assets/theme-*.css)");
rmrf(stage);
