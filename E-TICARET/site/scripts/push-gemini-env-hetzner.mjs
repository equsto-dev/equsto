/**
 * Gemini görsel arama yedek → Hetzner .env.production (SSH)
 *   node scripts/push-gemini-env-hetzner.mjs .env.gemini.secrets
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv =
  process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const secretsPath = process.argv[2];

const KEYS = ["GEMINI_API_KEY", "GEMINI_VISION_MODEL"];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "[push-gemini-env] Kullanım: node scripts/push-gemini-env-hetzner.mjs <secrets.env>",
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

if (!parsed.GEMINI_API_KEY?.startsWith("AIza")) {
  console.error(
    "[push-gemini-env] Eksik veya geçersiz: GEMINI_API_KEY (AIza… ile başlamalı)",
  );
  process.exit(1);
}

parsed.GEMINI_VISION_MODEL = parsed.GEMINI_VISION_MODEL || "gemini-2.5-flash";

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.gemini-patch");
const patchLines = KEYS.filter((k) => parsed[k]).map((k) => `${k}=${parsed[k]}`);
fs.writeFileSync(tmp, `${patchLines.join("\n")}\n`, "utf8");

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-gemini.env`], {
  stdio: "inherit",
});
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^GEMINI_API_KEY=' "$ENV" | grep -v '^GEMINI_VISION_MODEL=' > "$ENV.tmp"
cat /tmp/equsto-gemini.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-gemini.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
