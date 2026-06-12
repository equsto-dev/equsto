/**
 * WhatsApp (Green API) → Hetzner .env.production (SSH)
 *   node scripts/push-whatsapp-env-hetzner.mjs .env.whatsapp.secrets
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
  "EQUSTO_WHATSAPP_MODE",
  "GREEN_API_INSTANCE_ID",
  "GREEN_API_TOKEN",
  "EQUSTO_WHATSAPP_E164",
];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "[push-whatsapp-env] Kullanım: node scripts/push-whatsapp-env-hetzner.mjs <secrets.env>",
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

parsed.EQUSTO_WHATSAPP_MODE = parsed.EQUSTO_WHATSAPP_MODE || "green-api";
if (!parsed.GREEN_API_INSTANCE_ID || !parsed.GREEN_API_TOKEN) {
  console.error("[push-whatsapp-env] Eksik: GREEN_API_INSTANCE_ID ve GREEN_API_TOKEN");
  process.exit(1);
}

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.whatsapp-patch");
const patchLines = KEYS.filter((k) => parsed[k]).map((k) => `${k}=${parsed[k]}`);
fs.writeFileSync(tmp, `${patchLines.join("\n")}\n`, "utf8");

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-whatsapp.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^EQUSTO_WHATSAPP_MODE=' "$ENV" | grep -v '^GREEN_API_INSTANCE_ID=' | grep -v '^GREEN_API_TOKEN=' | grep -v '^EQUSTO_WHATSAPP_E164=' > "$ENV.tmp"
cat /tmp/equsto-whatsapp.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-whatsapp.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
