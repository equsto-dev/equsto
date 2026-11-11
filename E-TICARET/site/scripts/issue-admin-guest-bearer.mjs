/**
 * 1 günlük (veya N saat) misafir admin Bearer — senin EQUSTO_ADMIN_BEARER değişmez.
 *
 * Üret + canlıya yaz:
 *   node scripts/issue-admin-guest-bearer.mjs --issue --hours=24
 *
 * Süre dolmadan iptal:
 *   node scripts/issue-admin-guest-bearer.mjs --revoke
 *
 * Sadece yerel dosya (push yok):
 *   node scripts/issue-admin-guest-bearer.mjs --issue --hours=24 --local-only
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.HETZNER_HOST || "167.233.86.144";
const remoteEnv =
  process.env.HETZNER_ENV_PATH || "/opt/equsto/E-TICARET/site/.env.production";
const guestFile = path.join(siteDir, ".env.admin-guest.local");

const args = process.argv.slice(2);
const issue = args.includes("--issue");
const revoke = args.includes("--revoke");
const localOnly = args.includes("--local-only");
const hoursArg = args.find((a) => a.startsWith("--hours="));
const hours = Math.max(1, Math.min(168, Number(hoursArg?.slice(8) || 24) || 24));

function sshIdentityArgs() {
  const candidates = [
    process.env.DEPLOY_SSH_IDENTITY,
    path.join(os.homedir(), ".ssh", "id_ed25519"),
    path.join(os.homedir(), ".ssh", "equsto-hetzner-deploy-rotate"),
    path.join(os.homedir(), ".ssh", "equsto_deploy_new"),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return ["-i", p, "-o", "IdentitiesOnly=yes"];
  }
  return [];
}

function upsertEnvFile(filePath, patch) {
  let text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (text && !text.endsWith("\n")) text += "\n";
  for (const [key, val] of Object.entries(patch)) {
    const line = val == null || val === "" ? null : `${key}=${val}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (line == null) {
      text = text.replace(re, "").replace(/\n{3,}/g, "\n\n");
      continue;
    }
    if (re.test(text)) text = text.replace(re, line);
    else text += `${line}\n`;
  }
  fs.writeFileSync(filePath, text, "utf8");
}

function pushGuestToHetzner(patch) {
  const tmp = path.join(siteDir, ".env.admin-guest-patch");
  const lines = Object.entries(patch)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${v}`);
  // revoke: boşaltmak için dosyada satır olmamalı — remote grep siler
  fs.writeFileSync(tmp, lines.length ? `${lines.join("\n")}\n` : "", "utf8");

  const idArgs = sshIdentityArgs();
  const scp = spawnSync(
    "scp",
    [...idArgs, tmp, `root@${host}:/tmp/equsto-admin-guest.env`],
    { stdio: "inherit" },
  );
  fs.unlinkSync(tmp);
  if (scp.status !== 0) {
    console.error("[guest-bearer] scp başarısız");
    process.exit(scp.status ?? 1);
  }

  const remoteScript = `
set -euo pipefail
ENV="${remoteEnv}"
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }
grep -v '^EQUSTO_ADMIN_BEARER_GUEST=' "$ENV" | grep -v '^EQUSTO_ADMIN_BEARER_GUEST_EXPIRES=' > "$ENV.tmp"
if [ -s /tmp/equsto-admin-guest.env ]; then
  cat /tmp/equsto-admin-guest.env >> "$ENV.tmp"
fi
mv "$ENV.tmp" "$ENV"
rm -f /tmp/equsto-admin-guest.env
cd /opt/equsto/E-TICARET/site
docker compose --env-file .env.production up -d app
echo OK
`;

  const ssh = spawnSync(
    "ssh",
    [...idArgs, `root@${host}`, remoteScript],
    { stdio: "inherit" },
  );
  if (ssh.status !== 0) process.exit(ssh.status ?? 1);
}

if (!issue && !revoke) {
  console.log(`Kullanım:
  node scripts/issue-admin-guest-bearer.mjs --issue --hours=24
  node scripts/issue-admin-guest-bearer.mjs --revoke
`);
  process.exit(1);
}

if (issue) {
  const token = `equsto-guest-${randomBytes(24).toString("hex")}`;
  const expires = new Date(Date.now() + hours * 3600_000).toISOString();
  const patch = {
    EQUSTO_ADMIN_BEARER_GUEST: token,
    EQUSTO_ADMIN_BEARER_GUEST_EXPIRES: expires,
  };

  fs.writeFileSync(
    guestFile,
    [
      `# Misafir admin — git’e koyma`,
      `EQUSTO_ADMIN_BEARER_GUEST=${token}`,
      `EQUSTO_ADMIN_BEARER_GUEST_EXPIRES=${expires}`,
      `# hours=${hours}`,
      "",
    ].join("\n"),
    "utf8",
  );
  upsertEnvFile(path.join(siteDir, ".env.production.hetzner"), patch);

  if (!localOnly) pushGuestToHetzner(patch);

  console.log("\n=== Misafir Bearer hazır ===");
  console.log(`Süre: ${hours} saat`);
  console.log(`Bitiş (UTC): ${expires}`);
  console.log(`Panel: https://equsto.com/pro  (veya yönetim girişi)`);
  console.log("\nAjansa ver (tırnaksız):\n");
  console.log(token);
  console.log(`\nKayıt: ${guestFile}`);
  console.log("Senin EQUSTO_ADMIN_BEARER değişmedi.");
  console.log("Süre dolunca otomatik 401; erken kesmek için: npm run admin:guest:revoke\n");
  process.exit(0);
}

// revoke
const clear = {
  EQUSTO_ADMIN_BEARER_GUEST: "",
  EQUSTO_ADMIN_BEARER_GUEST_EXPIRES: "",
};
upsertEnvFile(path.join(siteDir, ".env.production.hetzner"), clear);
if (fs.existsSync(guestFile)) fs.unlinkSync(guestFile);
if (!localOnly) {
  // remote: satırları sil
  pushGuestToHetzner({});
}
console.log("\nMisafir Bearer iptal edildi (canlıdan kaldırıldı).\n");
