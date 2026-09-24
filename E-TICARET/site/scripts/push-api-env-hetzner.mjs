/**
 * Tüm API secret’ları → Hetzner keep + .env.production (SSH)
 *   node scripts/push-api-env-hetzner.mjs .env.api.secrets
 *
 * Keep: /opt/equsto/.env.production.keep (kalıcı)
 * Site: /opt/equsto/E-TICARET/site/.env.production
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv =
  process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const remoteKeep =
  process.env.EQUSTO_ENV_KEEP || "/opt/equsto/.env.production.keep";
const secretsPath = process.argv[2];

const KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "EQUSTO_GOOGLE_CLIENT_ID",
  "EQUSTO_GOOGLE_CLIENT_SECRET",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "GEMINI_API_KEY",
  "GEMINI_VISION_MODEL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "RESEND_ACCOUNT_EMAIL",
  "EQUSTO_NOTIFY_EMAIL",
  "EQUSTO_WHATSAPP_MODE",
  "GREEN_API_INSTANCE_ID",
  "GREEN_API_TOKEN",
  "GREEN_API_WEBHOOK_TOKEN",
  "GREEN_API_INSTANCE_WID",
  "EQUSTO_WHATSAPP_E164",
  "WHATSAPP_NOTIFY_TO",
  "WHATSAPP_NOTIFY_ALT_TO",
  "DATABASE_URL",
  "DIRECT_URL",
  "EQUSTO_ADMIN_BEARER",
  "TEPEPLATFORM_ENABLED",
  "TEPEPLATFORM_BASE_URL",
  "TEPEPLATFORM_API_KEY",
  "TEPEPLATFORM_API_SECRET",
  "TEPEPLATFORM_PARTNER_SLUG",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "EQUSTO_NOTIFY_SMS_E164",
];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "[push-api-env] Kullanım: node scripts/push-api-env-hetzner.mjs .env.api.secrets",
  );
  process.exit(1);
}

const parsed = {};
for (const line of fs.readFileSync(secretsPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
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
  if (val) parsed[key] = val;
}

const present = KEYS.filter((k) => parsed[k]);
if (!present.length) {
  console.error("[push-api-env] Dosyada dolu anahtar yok");
  process.exit(1);
}

if (parsed.ANTHROPIC_API_KEY && !parsed.ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
  console.error("[push-api-env] ANTHROPIC_API_KEY sk-ant- ile başlamalı");
  process.exit(1);
}

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.api-patch");
fs.writeFileSync(
  tmp,
  `${present.map((k) => `${k}=${parsed[k]}`).join("\n")}\n`,
  "utf8",
);

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-api.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const keysPattern = present.map((k) => `^${k}=`).join("|");
const remoteScript = `
set -euo pipefail
PATCH=/tmp/equsto-api.env
merge_file() {
  local ENV="$1"
  test -f "$ENV" || touch "$ENV"
  local tmp
  tmp="$(mktemp)"
  grep -vE '${keysPattern}' "$ENV" > "$tmp" || true
  cat "$PATCH" >> "$tmp"
  mv "$tmp" "$ENV"
  echo "merged $ENV"
}
merge_file "${remoteEnv}"
merge_file "${remoteKeep}"
rm -f "$PATCH"
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
docker compose --env-file .env.production exec -T app node -e 'const v=process.env.ANTHROPIC_API_KEY||""; console.log("CONTAINER_ANTHROPIC="+(v.startsWith("sk-ant-")?"ok":"MISSING"));' || true
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, "bash", "-s"], {
  input: remoteScript,
  encoding: "utf8",
  stdio: ["pipe", "inherit", "inherit"],
});
process.exit(ssh.status ?? 1);
