/**
 * Resend e-posta → Hetzner .env.production (SSH)
 *   node scripts/push-resend-env-hetzner.mjs .env.resend.secrets
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
  "RESEND_API_KEY",
  "RESEND_FROM",
  "RESEND_ACCOUNT_EMAIL",
  "EQUSTO_NOTIFY_EMAIL",
  "EQUSTO_TEKLIF_FROM",
];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "[push-resend-env] Kullanım: node scripts/push-resend-env-hetzner.mjs <secrets.env>",
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

if (!parsed.RESEND_API_KEY?.startsWith("re_")) {
  console.error("[push-resend-env] Eksik veya geçersiz: RESEND_API_KEY (re_...)");
  process.exit(1);
}

parsed.RESEND_FROM =
  parsed.RESEND_FROM || "Equsto <onboarding@resend.dev>";
parsed.RESEND_ACCOUNT_EMAIL =
  parsed.RESEND_ACCOUNT_EMAIL || "jurnaldang@gmail.com";
parsed.EQUSTO_NOTIFY_EMAIL =
  parsed.EQUSTO_NOTIFY_EMAIL || parsed.RESEND_ACCOUNT_EMAIL;

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.resend-patch");
const patchLines = KEYS.filter((k) => parsed[k]).map((k) => `${k}=${parsed[k]}`);
fs.writeFileSync(tmp, `${patchLines.join("\n")}\n`, "utf8");

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-resend.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^RESEND_API_KEY=' "$ENV" | grep -v '^RESEND_FROM=' | grep -v '^RESEND_ACCOUNT_EMAIL=' | grep -v '^EQUSTO_NOTIFY_EMAIL=' | grep -v '^EQUSTO_TEKLIF_FROM=' > "$ENV.tmp"
cat /tmp/equsto-resend.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-resend.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
