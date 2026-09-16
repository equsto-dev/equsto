import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const secrets = path.join(siteDir, ".env.whatsapp.secrets");

for (const line of fs.readFileSync(secrets, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  const key = t.slice(0, i).trim();
  let val = t.slice(i + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (val) process.env[key] = val;
}

const r = spawnSync(
  process.execPath,
  ["scripts/configure-green-api-webhook.mjs"],
  { stdio: "inherit", cwd: siteDir, env: process.env },
);
process.exit(r.status ?? 1);
