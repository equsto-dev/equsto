/**
 * admin-config.js — git'e girmez.
 * .env.local / .env → EQUSTO_ADMIN_BEARER (scripts/load-env.mjs)
 */
import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "admin-config.js");

const site = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

const apiBase = `${site}/api`;
const bearer = process.env.EQUSTO_ADMIN_BEARER || "";
const pwSha = process.env.EQUSTO_ADMIN_PW_SHA256 || "";

const lines = [
  "/* Otomatik — scripts/generate-admin-config.mjs; repoya koymayın */",
  "(function () {",
  `  window.EQUSTO_API_BASE = ${JSON.stringify(apiBase)};`,
  `  window.EQUSTO_PRODUCTS_API_BASE = ${JSON.stringify(apiBase)};`,
  `  window.EQUSTO_CLAUDE_API_BASE = ${JSON.stringify(apiBase)};`,
];

if (bearer) {
  lines.push(`  window.EQUSTO_ADMIN_BEARER = ${JSON.stringify(bearer)};`);
} else {
  lines.push(
    "  /* Yerelde admin.html varsayılan: equsto2025 — production'da EQUSTO_ADMIN_BEARER zorunlu */"
  );
}

if (pwSha) {
  lines.push(`  window.EQUSTO_ADMIN_PW_SHA256 = ${JSON.stringify(pwSha)};`);
}

lines.push("})();", "");

fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log("[admin-config] →", OUT);
console.log("[admin-config] API:", apiBase);
console.log("[admin-config] Bearer:", bearer ? "(ayarlı)" : "(yok — dev: equsto2025)");
