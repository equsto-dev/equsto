/**
 * DATABASE_URL + DIRECT_URL → Hetzner .env.production (SSH)
 * Kullanım (değerler bu dosyada görünmez — yerel secrets dosyasından):
 *   node scripts/push-db-env-hetzner.mjs path/to/secrets.env
 *
 * secrets.env formatı (Vercel/Supabase'den kopyala, tırnak yok):
 *   DATABASE_URL=postgresql://...
 *   DIRECT_URL=postgresql://...
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv = process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const secretsPath = process.argv[2];

if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error("[push-db-env] Kullanım: node scripts/push-db-env-hetzner.mjs <secrets.env>");
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

for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
  if (!parsed[k]?.startsWith("postgresql://")) {
    console.error(`[push-db-env] Eksik veya geçersiz: ${k}`);
    process.exit(1);
  }
}

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(siteDir, ".env.db-patch");
fs.writeFileSync(
  tmp,
  `DATABASE_URL=${parsed.DATABASE_URL}\nDIRECT_URL=${parsed.DIRECT_URL}\n`,
  "utf8",
);

const scp = spawnSync("scp", [tmp, `root@${host}:/tmp/equsto-db.env`], { stdio: "inherit" });
fs.unlinkSync(tmp);
if (scp.status !== 0) process.exit(scp.status ?? 1);

const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^DATABASE_URL=' "$ENV" | grep -v '^DIRECT_URL=' > "$ENV.tmp"
cat /tmp/equsto-db.env >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-db.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

const ssh = spawnSync("ssh", [`root@${host}`, remoteScript], { stdio: "inherit" });
process.exit(ssh.status ?? 0);
