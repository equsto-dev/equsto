/**
 * .env → index.html <head> webmaster doğrulama meta etiketleri
 * public/ + dist/ (deploy dist kullanir)
 * npm run seo:verification
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

const SPECS = [
  { env: "GOOGLE_SITE_VERIFICATION", name: "google-site-verification", label: "Google" },
  { env: "BING_SITE_VERIFICATION", name: "msvalidate.01", label: "Bing" },
  { env: "YANDEX_SITE_VERIFICATION", name: "yandex-verification", label: "Yandex" },
];

const INDEX_PATHS = [
  path.join(root, "public", "index.html"),
  path.join(root, "dist", "index.html"),
].filter((p) => fs.existsSync(p));

function loadEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] == null) process.env[k] = v;
  }
}

function escAttr(v) {
  return String(v).replace(/"/g, "&quot;");
}

function metaTag(name, content) {
  return `<meta name="${name}" content="${escAttr(content)}">`;
}

function injectFile(indexPath, active) {
  let html = fs.readFileSync(indexPath, "utf8");
  const inserted = [];
  for (const { name, token, label } of active) {
    const re = new RegExp(`\\s*<meta name="${name.replace(/\./g, "\\.")}"[^>]*>\\s*`, "gi");
    html = html.replace(re, "\n");
    if (!html.includes(`name="${name}"`)) {
      const tag = metaTag(name, token);
      html = html.replace(/<meta charset="UTF-8">/i, `<meta charset="UTF-8">\n${tag}`);
      inserted.push(label);
    }
  }
  fs.writeFileSync(indexPath, html, "utf8");
  return { rel: path.relative(root, indexPath), inserted };
}

loadEnv();

const active = SPECS.map((s) => ({
  ...s,
  token: String(process.env[s.env] || "").trim(),
})).filter((s) => s.token);

if (!active.length) {
  console.error(
    "[seo:verification] .env icinde en az biri gerekli:\n" +
      "  GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION, YANDEX_SITE_VERIFICATION"
  );
  process.exit(1);
}

if (!INDEX_PATHS.length) {
  console.error("[seo:verification] index.html bulunamadi (public/ veya dist/)");
  process.exit(1);
}

for (const p of INDEX_PATHS) {
  const { rel, inserted } = injectFile(p, active);
  console.log("[seo:verification]", rel, "→", inserted.length ? inserted.join(", ") : "(zaten var)");
}
console.log("[seo:verification] Deploy: node scripts/deploy-cpanel-sftp.mjs --files index.html");
