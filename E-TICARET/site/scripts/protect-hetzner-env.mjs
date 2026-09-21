/**
 * Hetzner .env.production — git reset boş şablonla ezmesin.
 * Keep: /opt/equsto/.env.production.keep
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

function findAppContainer() {
  const filters = [
    ["--filter", "ancestor=equsto-app:latest"],
    ["--filter", "name=equsto-app-1"],
    ["--filter", "name=equsto-app"],
  ];
  for (const f of filters) {
    const r = spawnSync("docker", ["ps", "-q", ...f], { encoding: "utf8" });
    const id = String(r.stdout || "")
      .trim()
      .split(/\s+/)
      .find(Boolean);
    if (id) return id;
  }
  return "";
}

function recoverSecrets() {
  const merged = {};
  const sources = [];
  const saves = [
    path.join(siteDir, ".env.production.save"),
    "/opt/equsto/.env.production.keep.bak",
    "/opt/equsto/.env.production.save",
  ];
  for (const file of saves) {
    const map = readMap(file);
    if (Object.keys(map).length) {
      Object.assign(merged, map);
      sources.push(path.basename(file));
    }
  }
  const cid = findAppContainer();
  if (cid) {
    const dump = spawnSync("docker", ["exec", cid, "printenv"], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });
    if (dump.status === 0) {
      Object.assign(merged, parseEnv(dump.stdout || ""));
      sources.push("container");
    }
  }
  ensureDirectUrl(merged);
  if (looksReal(merged)) {
    console.log(`[protect-hetzner-env] recovered from ${sources.join("+") || "none"}`);
    return merged;
  }
  return {};
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

if (!looksReal(site) && !looksReal(keep)) {
  const recovered = recoverSecrets();
  if (looksReal(recovered)) {
    fs.mkdirSync(path.dirname(keepPath), { recursive: true });
    writeMerged(keepPath, fs.existsSync(keepPath) ? fs.readFileSync(keepPath, "utf8") : "", recovered);
    Object.assign(keep, recovered);
  }
}

let source = "site";
if (!looksReal(site) && looksReal(keep)) {
  source = "keep";
  fs.mkdirSync(path.dirname(keepPath), { recursive: true });
  writeMerged(envPath, fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "", keep);
} else if (looksReal(site)) {
  const overlay = { ...keep, ...site };
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

const googleSecret = String(process.env.GOOGLE_CLIENT_SECRET || process.env.EQUSTO_GOOGLE_CLIENT_SECRET || "").trim();
const googleId = String(
  process.env.EQUSTO_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "",
).trim();
const googleOverlay = {};
if (googleSecret.length >= 16) googleOverlay.GOOGLE_CLIENT_SECRET = googleSecret;
if (googleId.length >= 16) {
  googleOverlay.GOOGLE_CLIENT_ID = googleId;
  googleOverlay.NEXT_PUBLIC_GOOGLE_CLIENT_ID = googleId;
  googleOverlay.EQUSTO_GOOGLE_CLIENT_ID = googleId;
}
if (Object.keys(googleOverlay).length) {
  writeMerged(envPath, fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "", googleOverlay);
  fs.mkdirSync(path.dirname(keepPath), { recursive: true });
  writeMerged(keepPath, fs.existsSync(keepPath) ? fs.readFileSync(keepPath, "utf8") : "", googleOverlay);
  console.log(
    `[protect-hetzner-env] google oauth merged secret=${googleSecret.length >= 16 ? "ok" : "MISSING"} clientId=${googleId.length >= 16 ? "ok" : "MISSING"}`,
  );
}

const anthropicKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
if (anthropicKey.length >= 20) {
  const anthropicOverlay = { ANTHROPIC_API_KEY: anthropicKey };
  writeMerged(envPath, fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "", anthropicOverlay);
  fs.mkdirSync(path.dirname(keepPath), { recursive: true });
  writeMerged(keepPath, fs.existsSync(keepPath) ? fs.readFileSync(keepPath, "utf8") : "", anthropicOverlay);
  console.log("[protect-hetzner-env] ANTHROPIC_API_KEY merged from deploy env");
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
const okGoogle = String(final.GOOGLE_CLIENT_SECRET || "").length >= 16;
const okGoogleId = String(final.GOOGLE_CLIENT_ID || final.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").length >= 16;
const okAnthropic = String(final.ANTHROPIC_API_KEY || "").trim().length >= 20;
console.log(
  `[protect-hetzner-env] source=${source} DATABASE_URL=${okDb ? "ok" : "MISSING"} DIRECT_URL=${okDirect ? "ok" : "MISSING"} MEILISEARCH_HOST=${okMeili ? "ok" : "MISSING"} EQUSTO_ADMIN_BEARER_len=${bearerLen} GOOGLE_CLIENT_SECRET=${okGoogle ? "ok" : "MISSING"} GOOGLE_CLIENT_ID=${okGoogleId ? "ok" : "MISSING"} ANTHROPIC_API_KEY=${okAnthropic ? "ok" : "MISSING"}`,
);

if (!okDb || !okDirect) {
  console.error("[protect-hetzner-env] HATA: DATABASE_URL / DIRECT_URL gerekli");
  process.exit(1);
}
if (bearerLen < 16) {
  console.error("[protect-hetzner-env] HATA: EQUSTO_ADMIN_BEARER boş — admin girişi 503 olur");
  process.exit(1);
}
