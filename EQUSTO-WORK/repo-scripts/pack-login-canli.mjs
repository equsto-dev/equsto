/**
 * Üye girişi canlı yama — login.html + CSS/JS bağımlılıkları.
 * cPanel: public_html köküne extract (alt klasör değil).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const pub = path.join(root, "public");
const outZip = path.join(root, "equsto-login-canli.zip");
const stage = path.join(root, ".deploy-stage-login");

const files = [
  "login.html",
  "theme.css",
  "auth.css",
  "theme.js",
  "equsto-member.js",
  "eq-auth-api.js",
  "auth-api-base.json",
  "equsto-auth-client.js",
  "equsto-logo.js",
  "eq-i18n.js",
  "eq-site-urls.js",
  "auth-social.js",
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

// dist/login.html: cache-bust (?v=) + inline kritik CSS
try {
  execSync("node scripts/fix-dist-html-css.mjs", { cwd: root, stdio: "pipe" });
} catch (e) {
  console.warn("[pack-login] fix-dist atlandi:", e.message);
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
let n = 0;
for (const rel of files) {
  const src = resolveSrc(rel);
  if (!src) {
    console.error("[pack-login] Eksik:", rel, "— önce: npm run build");
    process.exit(1);
  }
  const dst = path.join(stage, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log("[pack-login]", rel);
  n++;
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
const kb = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`\n[pack-login] Hazir: ${outZip} (${kb} KB, ${n} dosya)`);
console.log("[pack-login] cPanel → public_html → ZIP yükle → Extract → Cloudflare Purge");
rmrf(stage);
