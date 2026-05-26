/**
 * Kategori çekmecesi — logosuz Amazon TR kök liste (eq-mcat-list--amazon).
 * cPanel: public_html köküne nav.js + theme.css (ZIP içinden Extract).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");
const outZip = path.join(root, "equsto-cat-drawer-canli.zip");
const stage = path.join(root, ".deploy-stage-cat-drawer");

const files = ["nav.js", "theme.css"];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function resolveSrc(rel) {
  const p = path.join(pub, rel);
  if (fs.existsSync(p)) return p;
  const d = path.join(dist, rel);
  if (fs.existsSync(d)) return d;
  return null;
}

try {
  execSync("node scripts/fix-dist-html-css.mjs", { cwd: root, stdio: "inherit" });
} catch (e) {
  console.error("[pack] fix-dist basarisiz:", e.message);
  process.exit(1);
}

const navSrc = fs.readFileSync(path.join(dist, "nav.js"), "utf8");
if (!/eq-mcat-list--amazon/.test(navSrc) || !/buildDrawerAmazonRootRow/.test(navSrc)) {
  console.error("[pack] dist/nav.js Amazon logosuz cekmece kodu yok — public/nav.js kontrol edin.");
  process.exit(1);
}
if (/fillMegaRootColumn[\s\S]{0,800}eq-mcat-list--squares/.test(navSrc)) {
  console.error("[pack] dist/nav.js kok listede hala kare igridasi — sol-liste-KILIT.txt");
  process.exit(1);
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

const readme =
  "EQUSTO — Kategori çekmecesi (logosuz Amazon metin listesi)\n" +
  "==========================================================\n\n" +
  "1. cPanel → Dosya Yöneticisi → public_html\n" +
  "2. equsto-cat-drawer-canli.zip → Extract (üzerine yaz)\n" +
  "3. Dosyalar doğrudan public_html kökünde olmalı:\n" +
  "     public_html/nav.js\n" +
  "     public_html/theme.css\n\n" +
  "4. Cloudflare önbellek temizle (varsa) + tarayıcıda Ctrl+F5\n" +
  "5. Test: «Tüm Kategoriler» → dikey metin satırları, sağda ›, ikon/kare YOK\n" +
  "     «Markalarımız» altında metin marka listesi\n\n" +
  "Not: Eski nav.js önbelleği için npm run deploy:zip ile HTML ?v= güncellemesi.\n";
fs.writeFileSync(path.join(stage, "CPANEL-YUKLEME.txt"), readme, "utf8");

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });

const mb = (fs.statSync(outZip).size / (1024 * 1024)).toFixed(2);
console.log("\n[pack] Hazir:", outZip, `(${mb} MB)`);
console.log("[pack] cPanel: public_html → Extract");
rmrf(stage);
