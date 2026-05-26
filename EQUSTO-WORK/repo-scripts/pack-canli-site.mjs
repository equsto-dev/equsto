/**
 * Canli site ZIP: dist (data/images ve oztiryakiler-images haric ~150MB).
 * cPanel: public_html icine yukle + Extract.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-canli-site.zip");
const stage = path.join(root, ".deploy-stage");

const SKIP_PREFIXES = [
  "data" + path.sep + "images" + path.sep,
  "data" + path.sep + "oztiryakiler-images" + path.sep,
];

function shouldCopy(rel) {
  const n = rel.split(path.sep).join(path.sep);
  return !SKIP_PREFIXES.some((p) => n.startsWith(p));
}

function rmrf(p) {
  if (fs.existsSync(p)) {
    try {
      fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (e) {
      console.warn("[pack] rmrf uyari:", p, e.message);
    }
  }
}

function copyTree(srcDir, dstDir, base = "") {
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const rel = base ? base + path.sep + ent.name : ent.name;
    const sp = path.join(srcDir, ent.name);
    const dp = path.join(dstDir, rel);
    if (ent.isDirectory()) {
      if (!shouldCopy(rel + path.sep)) continue;
      fs.mkdirSync(dp, { recursive: true });
      copyTree(sp, dstDir, rel);
    } else if (shouldCopy(rel)) {
      fs.mkdirSync(path.dirname(dp), { recursive: true });
      fs.copyFileSync(sp, dp);
    }
  }
}

function listFiles(dir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + ent.name : ent.name;
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFiles(fp, rel));
    else out.push(rel);
  }
  return out;
}

function createZipWithTar() {
  const cwd = stage.replace(/\\/g, "/");
  const zip = outZip.replace(/\\/g, "/");
  execSync(`tar -a -cf "${zip}" -C "${cwd}" .`, { stdio: "inherit", cwd: root });
}

function createZipWithPowerShell() {
  const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
}

function verifyZip() {
  if (!fs.existsSync(outZip)) throw new Error("ZIP olusmadi: " + outZip);
  const expected = listFiles(stage).sort();
  let listed = [];
  try {
    const raw = execSync(`tar -tf "${outZip.replace(/\\/g, "/")}"`, { encoding: "utf8" });
    listed = raw
      .split(/\r?\n/)
      .map((s) => s.trim().replace(/\\/g, "/").replace(/^\.\//, ""))
      .filter((s) => s && !s.endsWith("/"))
      .sort();
  } catch (e) {
    console.warn("[pack] tar -tf dogrulama atlandi:", e.message);
    return;
  }
  const critical = [
    ".htaccess",
    "index.html",
    "theme.js",
    "theme.css",
    "contact.js",
    "contact.html",
    "ecom-cart.js",
    "eq-home-mutbex.css",
    "eq-mutbex-chrome.js",
    "eq-shop-vitrin.js",
    "eq-category-shell.js",
    "eq-dept-plp.css",
    "eq-dept-plp.js",
    "eq-dept-cm-facets.js",
    "eq-dept-tips.js",
    "sogutma.html",
  ];
  const missingCritical = critical.filter((f) => !listed.includes(f));
  if (missingCritical.length) {
    throw new Error("ZIP kritik dosya eksik: " + missingCritical.join(", "));
  }
  const missing = expected.filter((f) => !listed.includes(f));
  const extra = listed.filter((f) => !expected.includes(f));
  if (missing.length > 8 || Math.abs(listed.length - expected.length) > 12) {
    console.error("[pack] ZIP dosya sayisi uyumsuz — beklenen", expected.length, "zip", listed.length);
    console.error("[pack] Eksik ornek:", missing.slice(0, 8).join(", ") || "(yok)");
    if (missing.length <= 8 && missing.every((f) => /assets\/.*[öüçğıÖÜÇĞİ]/i.test(f))) {
      console.warn("[pack] Eksikler yalnizca Turkce karakterli asset adlari (zip icinde olabilir) — devam.");
    } else {
      throw new Error("ZIP tam degil — Explorer/antivirus kilidini kapatip tekrar deneyin.");
    }
  }
  if (extra.length > 12) {
    console.warn("[pack] ZIP fazla/garip giris:", extra.length);
  }
  console.log("[pack] Dogrulama OK:", listed.length, "dosya (beklenen", expected.length + ")");
}

if (!fs.existsSync(dist)) {
  console.error("[pack] dist/ yok. Once: npm run build");
  process.exit(1);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
copyTree(dist, stage);
if (fs.existsSync(outZip)) {
  try {
    fs.unlinkSync(outZip);
  } catch (e) {
    console.warn("[pack] Eski zip silinemedi (acik olabilir):", e.message);
  }
}

try {
  createZipWithTar();
} catch (e) {
  console.warn("[pack] tar zip basarisiz, PowerShell deneniyor:", e.message);
  createZipWithPowerShell();
}

verifyZip();

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(1);
console.log("\n[pack] Hazir:", outZip);
console.log("[pack] Boyut:", mb, "MB");
console.log("[pack] cPanel: public_html -> Yukle -> equsto-canli-site.zip -> Extract");
rmrf(stage);
