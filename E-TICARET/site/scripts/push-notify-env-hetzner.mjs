/**
 * Sahip bildirim env → Hetzner .env.production (SSH)
 *   node scripts/push-notify-env-hetzner.mjs .env.notify.secrets
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv =
  process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const secretsPath = process.argv[2];

const KEYS = [
  "WHATSAPP_NOTIFY_ALT_TO",
  "WHATSAPP_NOTIFY_TO",
  "GREEN_API_INSTANCE_WID",
  "EQUSTO_WHATSAPP_E164",
  "EQUSTO_NOTIFY_SMS_E164",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "[push-notify-env] Kullanım: node scripts/push-notify-env-hetzner.mjs <secrets.env>",
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

if (!parsed.WHATSAPP_NOTIFY_TO && !parsed.EQUSTO_WHATSAPP_E164) {
  console.error("[push-notify-env] Eksik: WHATSAPP_NOTIFY_TO veya EQUSTO_WHATSAPP_E164");
  process.exit(1);
}

parsed.WHATSAPP_NOTIFY_TO =
  parsed.WHATSAPP_NOTIFY_TO || parsed.EQUSTO_WHATSAPP_E164;
parsed.EQUSTO_NOTIFY_SMS_E164 =
  parsed.EQUSTO_NOTIFY_SMS_E164 ||
  parsed.WHATSAPP_NOTIFY_TO ||
  parsed.EQUSTO_WHATSAPP_E164;

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.notify-patch");
const patchLines = KEYS.filter((k) => parsed[k]).map((k) => `${k}=${parsed[k]}`);
fs.writeFileSync(tmp, `${patchLines.join("\n")}\n`, "utf8");

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-notify.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const grepV = KEYS.map((k) => `grep -v '^${k}='`).join(" | ");
const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
cat "$ENV" | ${grepV} > "$ENV.tmp"
cat /tmp/equsto-notify.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-notify.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
