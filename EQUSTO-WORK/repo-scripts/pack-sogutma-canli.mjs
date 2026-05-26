/**
 * Soğutma departmanı — yikama ile aynı dept PLP (Cafemarkt tarzı).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-sogutma-yama.zip");
const stage = path.join(root, ".deploy-stage-sogutma");

const FILES = [
  "sogutma.html",
  "theme.css",
  "theme.js",
  "equsto-logo.js",
  "eq-i18n.js",
  "eq-site-urls.js",
  "nav.js",
  "eq-home-mutbex.css",
  "eq-dept-plp.css",
  "eq-dept-plp.js",
  "eq-fiyatlar-bridge.js",
  "eq-dept-cm-facets.js",
  "eq-dept-tips.js",
  "eq-dept-plp-config.js",
  "ecom-cart.js",
  "ecom-data.js",
  "data/dept/sogutma.json",
  "data/fiyatlar.json",
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

if (!fs.existsSync(dist)) {
  console.error("[sogutma-yama] dist/ yok — npm run build");
  process.exit(1);
}

const html = fs.readFileSync(path.join(dist, "sogutma.html"), "utf8");
if (!/eq-dept-plp|data-eq-dept=["']sogutma["']/i.test(html)) {
  console.error("[sogutma-yama] sogutma.html dept PLP degil — npm run build");
  process.exit(1);
}

const missing = FILES.filter((f) => !fs.existsSync(path.join(dist, f)));
if (missing.length) {
  console.error("[sogutma-yama] Eksik:", missing.join(", "));
  process.exit(1);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
for (const f of FILES) {
  const src = path.join(dist, f);
  const dst = path.join(stage, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

const readme =
  "EQUSTO — Soğutma PLP (yikama şablonu)\n" +
  "============================\n\n" +
  "1. cPanel → public_html → Extract\n" +
  "2. Cloudflare Purge + Ctrl+F5\n" +
  "3. /sogutma.html — sol filtre + 4 sütun ürün grid\n\n" +
  "Görseller: public_html/data/images/ (~3 GB) yoksa fotoğraflar 404.\n" +
  "  npm run deploy:data-images → data/images extract\n";
fs.writeFileSync(path.join(stage, "CPANEL-YUKLEME.txt"), readme, "utf8");

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(`tar -a -cf "${outZip.replace(/\\/g, "/")}" -C "${stage.replace(/\\/g, "/")}" .`, {
  stdio: "inherit",
});
rmrf(stage);

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[sogutma-yama] Hazir:", outZip, `(${mb} MB)`);
