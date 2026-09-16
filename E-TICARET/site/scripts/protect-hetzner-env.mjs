/**
 * Hetzner .env.production — git reset boş şablonla ezmesin.
 * Keep: /opt/equsto/.env.production.keep
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDirectUrl } from "./lib/derive-direct-url.mjs";

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(siteDir, ".env.production");
const keepPath = process.env.EQUSTO_ENV_KEEP || "/opt/equsto/.env.production.keep";

function parseEnv(text) {
  const out = {};
  for (const line of String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("$")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) out[key] = val;
  }
  return out;
}

function looksReal(map) {
  const db = map.DATABASE_URL || "";
  const bearer = map.EQUSTO_ADMIN_BEARER || "";
  return (
    db.startsWith("postgresql://") &&
    !/YOUR_DB_PASSWORD|\[PASSWORD\]|^PASSWORD$/i.test(db) &&
    bearer.length >= 16
  );
}

function readMap(file) {
  if (!fs.existsSync(file)) return {};
  return parseEnv(fs.readFileSync(file, "utf8"));
}

function writeMerged(file, baseText, overlay) {
  const lines = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)
    : String(baseText || "").split(/\r?\n/);
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("$") || !t.includes("=")) {
      out.push(line);
      continue;
    }
    const i = t.indexOf("=");
    const key = t.slice(0, i).trim();
    if (overlay[key] != null) {
      out.push(`${key}=${overlay[key]}`);
      seen.add(key);
    } else {
      out.push(line);
    }
  }
  for (const [key, val] of Object.entries(overlay)) {
    if (!seen.has(key)) out.push(`${key}=${val}`);
  }
  const text = `${out.filter((l, idx, arr) => !(l === "" && arr[idx - 1] === "")).join("\n").replace(/\s+$/, "")}\n`;
  fs.writeFileSync(file, text, "utf8");
}

const site = readMap(envPath);
const keep = readMap(keepPath);
ensureDirectUrl(site);
ensureDirectUrl(keep);

let source = "site";
if (!looksReal(site) && looksReal(keep)) {
  source = "keep";
  fs.mkdirSync(path.dirname(keepPath), { recursive: true });
  writeMerged(envPath, fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "", keep);
} else if (looksReal(site)) {
  const overlay = { ...site };
  if (!overlay.DIRECT_URL && overlay.DATABASE_URL) {
    overlay.DIRECT_URL = ensureDirectUrl(overlay);
  }
  writeMerged(envPath, fs.readFileSync(envPath, "utf8"), overlay);
  fs.mkdirSync(path.dirname(keepPath), { recursive: true });
  fs.copyFileSync(envPath, keepPath);
} else if (!looksReal(site) && !looksReal(keep)) {
  if (site.DATABASE_URL && !site.DIRECT_URL) {
    writeMerged(envPath, fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "", {
      DIRECT_URL: ensureDirectUrl({ ...site }),
    });
  }
}

const final = readMap(envPath);
ensureDirectUrl(final);
const meiliOverlay = {};
if (!String(final.MEILISEARCH_HOST || "").trim()) {
  meiliOverlay.MEILISEARCH_HOST = "http://meilisearch:7700";
}
if (!String(final.MEILISEARCH_MASTER_KEY || "").trim()) {
  meiliOverlay.MEILISEARCH_MASTER_KEY = "equsto-prod-meili-key";
}
if (!String(final.MEILISEARCH_INDEX || "").trim()) {
  meiliOverlay.MEILISEARCH_INDEX = "equsto_products";
}
if (final.DIRECT_URL && final.DIRECT_URL !== site.DIRECT_URL) {
  meiliOverlay.DIRECT_URL = final.DIRECT_URL;
}
if (Object.keys(meiliOverlay).length) {
  writeMerged(envPath, fs.readFileSync(envPath, "utf8"), meiliOverlay);
  Object.assign(final, meiliOverlay);
  if (fs.existsSync(keepPath)) {
    writeMerged(keepPath, fs.readFileSync(keepPath, "utf8"), meiliOverlay);
  } else {
    fs.mkdirSync(path.dirname(keepPath), { recursive: true });
    fs.copyFileSync(envPath, keepPath);
  }
}

const okDb = String(final.DATABASE_URL || "").startsWith("postgresql://");
const okDirect = String(final.DIRECT_URL || "").startsWith("postgresql://");
const bearerLen = String(final.EQUSTO_ADMIN_BEARER || "").length;

const okMeili = String(final.MEILISEARCH_HOST || "").startsWith("http");
console.log(
  `[protect-hetzner-env] source=${source} DATABASE_URL=${okDb ? "ok" : "MISSING"} DIRECT_URL=${okDirect ? "ok" : "MISSING"} MEILISEARCH_HOST=${okMeili ? "ok" : "MISSING"} EQUSTO_ADMIN_BEARER_len=${bearerLen}`,
);

if (!okDb || !okDirect) {
  console.error("[protect-hetzner-env] HATA: DATABASE_URL / DIRECT_URL gerekli");
  process.exit(1);
}
if (bearerLen < 16) {
  console.error("[protect-hetzner-env] HATA: EQUSTO_ADMIN_BEARER boş — admin girişi 503 olur");
  process.exit(1);
}
