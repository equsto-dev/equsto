/**
 * Hetzner .env.production — Vercel pull + .env.local.template birleştirme.
 * DATABASE_URL boşsa stderr uyarı; dosya yine yazılır (build için).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(text) {
  const out = {};
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
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
    if (val !== "") out[key] = val;
  }
  return out;
}

const vercel = parseEnv(
  fs.existsSync(path.join(root, ".env.production"))
    ? fs.readFileSync(path.join(root, ".env.production"), "utf8")
    : "",
);
const template = parseEnv(
  fs.readFileSync(path.join(root, ".env.local.template"), "utf8"),
);
const example = parseEnv(
  fs.existsSync(path.join(root, ".env.example"))
    ? fs.readFileSync(path.join(root, ".env.example"), "utf8")
    : "",
);
const dbSecrets = parseEnv(
  fs.existsSync(path.join(root, ".env.database.secrets"))
    ? fs.readFileSync(path.join(root, ".env.database.secrets"), "utf8")
    : "",
);
const waSecrets = parseEnv(
  fs.existsSync(path.join(root, ".env.whatsapp.secrets"))
    ? fs.readFileSync(path.join(root, ".env.whatsapp.secrets"), "utf8")
    : "",
);

const skip = new Set([
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TARGET_ENV",
  "VERCEL_GIT_",
  "NX_DAEMON",
  "TURBO_",
]);
/** öncelik: template < example < vercel < dbSecrets < waSecrets */
const merged = { ...template, ...example, ...vercel, ...dbSecrets, ...waSecrets };
for (const k of Object.keys(merged)) {
  if ([...skip].some((p) => k.startsWith(p.replace(/_$/, "")) || k.startsWith(p))) {
    delete merged[k];
  }
}

merged.NEXT_PUBLIC_SITE_URL = "https://equsto.com";
merged.LEGACY_DATA_BASE = "https://equsto.com";
merged.NODE_ENV = "production";
merged.ACME_EMAIL = merged.ACME_EMAIL || "admin@equsto.com";
merged.NEXT_PUBLIC_ASSET_CDN_URL =
  merged.NEXT_PUBLIC_ASSET_CDN_URL ||
  merged.AWS_CLOUDFRONT_URL ||
  "https://dqb0g8etbedva.cloudfront.net";
merged.NEXT_PUBLIC_GA4_ID =
  merged.NEXT_PUBLIC_GA4_ID || "G-MVRNFQC4PQ";

/** Sunucuda yerel Meili — MEILISEARCH_HOST=http://meilisearch:7700 */
merged.MEILISEARCH_HOST = "http://meilisearch:7700";
merged.MEILISEARCH_MASTER_KEY = "equsto-prod-meili-key";
merged.MEILISEARCH_INDEX = merged.MEILISEARCH_INDEX || "equsto_products";

const dbPlaceholder =
  !merged.DATABASE_URL ||
  /YOUR_DB_PASSWORD|\[PASSWORD\]/i.test(merged.DATABASE_URL);
if (dbPlaceholder) {
  delete merged.DATABASE_URL;
  delete merged.DIRECT_URL;
  console.error(
    "[merge-hetzner-env] UYARI: DATABASE_URL eksik — Vercel panelinden ekleyin",
  );
} else {
  console.log("[merge-hetzner-env] DATABASE_URL mevcut");
}

const order = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ASSET_CDN_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GA4_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "DATABASE_URL",
  "DIRECT_URL",
  "MEILISEARCH_HOST",
  "MEILISEARCH_MASTER_KEY",
  "MEILISEARCH_INDEX",
  "EQUSTO_ADMIN_BEARER",
  "EQUSTO_ADMIN_RECOVERY_CODE",
  "LEGACY_DATA_BASE",
  "CRON_SECRET",
  "GOOGLE_CLIENT_ID",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GEMINI_VISION_MODEL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "EQUSTO_WHATSAPP_MODE",
  "GREEN_API_TOKEN",
  "GREEN_API_INSTANCE_ID",
  "AWS_CLOUDFRONT_URL",
  "ACME_EMAIL",
  "PRISMA_SKIP_POSTINSTALL_GENERATE",
  "TCMB_KUR_REVALIDATE_SEC",
  "EQUSTO_EUR_TRY_FALLBACK",
  "NODE_ENV",
];

const outPath = path.join(root, ".env.production.hetzner");
const linesOut = [];
const seenOut = new Set();
for (const k of order) {
  if (merged[k] == null) continue;
  linesOut.push(`${k}=${merged[k]}`);
  seenOut.add(k);
}
for (const k of Object.keys(merged).sort()) {
  if (seenOut.has(k)) continue;
  linesOut.push(`${k}=${merged[k]}`);
}
fs.writeFileSync(outPath, `${linesOut.join("\n")}\n`, "utf8");
console.log("[merge-hetzner-env] OK", outPath, linesOut.length, "keys");
