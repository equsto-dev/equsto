/**
 * DATABASE_URL, DIRECT_URL, EQUSTO_ADMIN_BEARER, Meilisearch → Hetzner .env.production + keep.
 * Değerler stdout'a yazılmaz.
 *
 *   node scripts/push-hetzner-runtime-secrets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ensureDirectUrl } from "./lib/derive-direct-url.mjs";

const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv = process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const keepPath = "/opt/equsto/.env.production.keep";
const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function loadLocal(name) {
  const file = path.join(siteDir, name);
  if (!fs.existsSync(file)) return {};
  return parseEnv(fs.readFileSync(file, "utf8"));
}

const merged = {
  ...loadLocal(".env.local.template"),
  ...loadLocal(".env.example"),
  ...loadLocal(".env.database.secrets"),
  ...loadLocal(".env.local"),
  ...loadLocal(".env.production.hetzner"),
};
ensureDirectUrl(merged);

for (const k of ["DATABASE_URL", "DIRECT_URL", "EQUSTO_ADMIN_BEARER"]) {
  if (!merged[k]) {
    console.error(`[push-hetzner-secrets] Eksik yerel değer: ${k}`);
    process.exit(1);
  }
}
if (!merged.DATABASE_URL.startsWith("postgresql://")) {
  console.error("[push-hetzner-secrets] DATABASE_URL geçersiz");
  process.exit(1);
}
if (String(merged.EQUSTO_ADMIN_BEARER).length < 16) {
  console.error("[push-hetzner-secrets] EQUSTO_ADMIN_BEARER çok kısa");
  process.exit(1);
}

const tmp = path.join(siteDir, ".env.runtime-patch");
const meiliHost = "http://meilisearch:7700";
const meiliKey =
  loadLocal(".env.production.hetzner").MEILISEARCH_MASTER_KEY ||
  "equsto-prod-meili-key";
const meiliIndex = merged.MEILISEARCH_INDEX || "equsto_products";

fs.writeFileSync(
  tmp,
  [
    `DATABASE_URL=${merged.DATABASE_URL}`,
    `DIRECT_URL=${merged.DIRECT_URL}`,
    `EQUSTO_ADMIN_BEARER=${merged.EQUSTO_ADMIN_BEARER}`,
    `MEILISEARCH_HOST=${meiliHost}`,
    `MEILISEARCH_MASTER_KEY=${meiliKey}`,
    `MEILISEARCH_INDEX=${meiliIndex}`,
    "",
  ].join("\n"),
  "utf8",
);

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-runtime.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
KEEP="${keepPath}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^DATABASE_URL=' "$ENV" | grep -v '^DIRECT_URL=' | grep -v '^EQUSTO_ADMIN_BEARER=' | grep -v '^MEILISEARCH_HOST=' | grep -v '^MEILISEARCH_MASTER_KEY=' | grep -v '^MEILISEARCH_INDEX=' > "$ENV.tmp"
cat /tmp/equsto-runtime.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
mkdir -p /opt/equsto
cp -a "$ENV" "$KEEP"
rm -f /tmp/equsto-runtime.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
