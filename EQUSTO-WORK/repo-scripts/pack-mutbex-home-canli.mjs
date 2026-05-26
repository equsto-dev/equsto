/**
 * Ana sayfa Mutbex vitrin akışı — hızlı canlı yama (index.html).
 * cPanel: public_html köküne index.html olarak yükle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-mutbex-home-canli.zip");
const stage = path.join(root, ".deploy-stage-mutbex-home");

const files = [
  "index.html",
  "theme.css",
  "theme.js",
  "eq-site-urls.js",
  "eq-home-mutbex.css",
  "eq-home-mutbex.js",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function resolveSrc(rel) {
  const d = path.join(dist, rel);
  if (fs.existsSync(d)) return d;
  const p = path.join(pub, rel);
  if (fs.existsSync(p)) return p;
  return null;
}

// dist güncel değilse public/index.html kopyala
const pubIndex = path.join(pub, "index.html");
const distIndex = path.join(dist, "index.html");
if (fs.existsSync(pubIndex)) {
  fs.mkdirSync(dist, { recursive: true });
  fs.copyFileSync(pubIndex, distIndex);
  console.log("[pack] public/index.html → dist/index.html");
}

try {
  execSync("node scripts/fix-dist-html-css.mjs", { cwd: root, stdio: "pipe" });
} catch (e) {
  console.warn("[pack] fix-dist atlandi:", e.message);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });

for (const rel of files) {
  const src = resolveSrc(rel);
  if (!src) {
    console.error("[pack] Eksik:", rel);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stage, rel));
  console.log("[pack]", rel);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack] Hazir:", outZip, `(${mb} MB)`);
console.log("[pack] cPanel: public_html → equsto-mutbex-home-canli.zip → Extract");
rmrf(stage);
