/**
 * Ana sayfa vitrin — kırık /data/images yerine emoji + yer tutucu; homepage-vitrin.json güncel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-home-vitrin-canli.zip");
const stage = path.join(root, ".deploy-stage-home-vitrin");

const rootFiles = [
  "eq-site-urls.js",
  "eq-home-mutbex.js",
  "eq-home-mutbex.css",
  "eq-vitrin-config.js",
];
const dataFiles = ["data/homepage-vitrin.json"];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

try {
  execSync("node scripts/fix-dist-html-css.mjs", { cwd: root, stdio: "inherit" });
} catch (e) {
  console.error("[pack] fix-dist:", e.message);
  process.exit(1);
}

rmrf(stage);
fs.mkdirSync(path.join(stage, "data"), { recursive: true });

for (const rel of rootFiles) {
  const src = path.join(pub, rel);
  if (!fs.existsSync(src)) {
    console.error("[pack] Eksik:", rel);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stage, rel));
  fs.copyFileSync(src, path.join(dist, rel));
  console.log("[pack]", rel);
}

for (const rel of dataFiles) {
  const src = path.join(pub, rel);
  if (!fs.existsSync(src)) {
    console.error("[pack] Eksik:", rel);
    process.exit(1);
  }
  const dstDir = path.join(stage, path.dirname(rel));
  fs.mkdirSync(dstDir, { recursive: true });
  fs.copyFileSync(src, path.join(stage, rel));
  fs.mkdirSync(path.join(dist, "data"), { recursive: true });
  fs.copyFileSync(src, path.join(dist, rel));
  console.log("[pack]", rel);
}

fs.writeFileSync(
  path.join(stage, "CPANEL-YUKLEME.txt"),
  [
    "EQUSTO — Ana sayfa vitrin (görsel yedek + JSON)",
    "==============================================",
    "",
    "1. public_html köküne ZIP içeriğini Extract edin.",
    "2. data/homepage-vitrin.json → public_html/data/homepage-vitrin.json",
    "3. Ctrl+F5 ile ana sayfayı yenileyin.",
    "",
    "Pişirme / Soğutma / Yıkama story: emoji (data/images yokken).",
    "Ürün fotoğrafları için: public_html/data/images/ ZIP yüklemesi şart.",
    "  npm run deploy:cpanel:ozti  ve  deploy:cpanel:kariyer",
    "",
  ].join("\n"),
  "utf8"
);

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

console.log("\n[pack] Hazir:", outZip);
rmrf(stage);
