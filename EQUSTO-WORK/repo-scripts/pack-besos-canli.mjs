/**
 * Bar Design (Besos) canlı ZIP — public_html köküne çıkarın.
 * Kaynak: public/ (HTML kök yolları) + dist/assets (buz görselleri) + .htaccess
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const stage = path.join(root, ".besos-deploy-stage");
const outZip = path.join(root, "equsto-besos-canli.zip");

const rootFiles = [
  "bar-design.html",
  "bar-module.html",
  "bar-module.css",
  "imt300.html",
  "theme.css",
  "contact.css",
  "eq-youtube-embed.css",
  "theme.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "nav.js",
  "equsto-member.js",
  "contact.js",
  "eq-youtube-embed.js",
  "eq-bar-module-url.js",
  "eq-bar-module.js",
  "eq-bar-design-vitrum.js",
];

const dataFiles = [
  "data/vitrum-bars-catalogue.json",
  "data/vitrum-bars-landing.json",
  "data/vitrum-bar-projects.json",
  "data/eq-besos-seo-ld.json",
  "data/eq-besos-seo-ld-en.json",
];

/** Vite hash'li asset → images/besos/ düz dosya adı */
const BESOS_ICE_FROM_DIST = [
  { glob: "besos-ice-mint-", out: "besos-ice-mint.png" },
  { glob: "besos-ice-bar-", out: "besos-ice-bar.png" },
  { glob: "besos-ice-tong-", out: "besos-ice-tong.png" },
  { glob: "besos-ice-diamond-", out: "besos-ice-diamond.png" },
  { glob: "besos-ice-molds-", out: "besos-ice-molds.png" },
  { glob: "besos-ice-sphere-", out: "besos-ice-sphere.png" },
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFrom(base, rel) {
  const src = path.join(base, rel);
  if (!fs.existsSync(src)) {
    console.error("[pack-besos] Eksik:", src);
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyTree(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, ent.name);
    const d = path.join(dstDir, ent.name);
    if (ent.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyDirFrom(base, rel) {
  const src = path.join(base, rel);
  if (!fs.existsSync(src)) {
    console.warn("[pack-besos] Atlandi (yok):", rel);
    return;
  }
  copyTree(src, path.join(stage, rel));
}

function copyBesosIceAssets() {
  const assetsDir = path.join(dist, "assets");
  const outDir = path.join(stage, "images", "besos");
  if (!fs.existsSync(assetsDir)) {
    console.warn("[pack-besos] dist/assets yok — buz görselleri atlandi (npm run build önerilir).");
    return;
  }
  const files = fs.readdirSync(assetsDir);
  fs.mkdirSync(outDir, { recursive: true });
  for (const { glob, out } of BESOS_ICE_FROM_DIST) {
    const hit = files.find((f) => f.startsWith(glob) && f.endsWith(".png"));
    if (!hit) {
      console.warn("[pack-besos] Buz görseli yok:", glob);
      continue;
    }
    fs.copyFileSync(path.join(assetsDir, hit), path.join(outDir, out));
    console.log("[pack-besos] images/besos/" + out);
  }
}

function copyHtaccess() {
  const fromDist = path.join(dist, ".htaccess");
  const fromDeploy = path.join(root, "deploy", "cpanel-htaccess.example");
  const dst = path.join(stage, ".htaccess");
  if (fs.existsSync(fromDist)) {
    fs.copyFileSync(fromDist, dst);
    console.log("[pack-besos] .htaccess (dist)");
  } else if (fs.existsSync(fromDeploy)) {
    fs.copyFileSync(fromDeploy, dst);
    console.log("[pack-besos] .htaccess (deploy örnek)");
  } else {
    console.warn("[pack-besos] .htaccess yok — sunucuda /besos kuralı olmalı.");
  }
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

for (const f of rootFiles) copyFrom(pub, f);
for (const f of dataFiles) copyFrom(pub, f);
copyDirFrom(pub, "data/vitrum-drawings");
copyDirFrom(dist, "besos/modul");
copyDirFrom(pub, "images/imt300");
copyDirFrom(pub, "i18n");
copyBesosIceAssets();
copyHtaccess();

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
try {
  execSync(`tar -a -cf "${outZip}" -C "${stage}" .`, { stdio: "inherit" });
} catch (e) {
  console.warn("[pack-besos] tar basarisiz, Compress-Archive...");
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
}
rmrf(stage);

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(1);
console.log(`\n[pack-besos] ${outZip} (${mb} MB)`);
console.log("[pack-besos] cPanel → Dosya Yöneticisi → public_html → ZIP yükle → Extract.");
console.log("[pack-besos] Test: https://equsto.com/besos");
console.log("[pack-besos] Modül: https://equsto.com/besos/modul/the-manhattan");
console.log("[pack-besos] IMT300: https://equsto.com/imt300");
