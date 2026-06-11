/**
 * Vercel REST API → .env.production.hetzner (şifreli değerler)
 * Kullanım: node scripts/pull-vercel-env-to-production.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectId = "prj_lh8F1INQWSM2mlZhfXqCr6n3k5xW";
const teamId = "team_hZXt5KSaJH22LQslgCHNoZpI";

function findToken() {
  const candidates = [
    path.join(os.homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
    path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "xdg.data",
      "com.vercel.cli",
      "auth.json",
    ),
    path.join(os.homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (j.token) return j.token;
  }
  return process.env.VERCEL_TOKEN?.trim() || "";
}

const token = findToken();
if (!token) {
  console.error("[pull-vercel-env] Vercel token yok — vercel login");
  process.exit(1);
}

const url = `https://api.vercel.com/v10/projects/${projectId}/env?decrypt=true&teamId=${teamId}`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!res.ok) {
  console.error("[pull-vercel-env] API", res.status, await res.text());
  process.exit(1);
}

const { envs } = await res.json();
const prod = envs.filter(
  (e) => e.target?.includes("production") || e.target?.includes("preview"),
);
const map = {};
for (const e of prod) {
  if (!e.key || e.value == null || e.value === "") continue;
  if (!map[e.key] || e.target?.includes("production")) map[e.key] = e.value;
}

const skip = /^VERCEL_|^TURBO_|^NX_/;
const lines = Object.keys(map)
  .filter((k) => !skip.test(k))
  .sort()
  .map((k) => `${k}=${map[k]}`);

const out = path.join(root, ".env.production.hetzner");
fs.writeFileSync(out, `${lines.join("\n")}\n`, "utf8");

const hasDb = Boolean(map.DATABASE_URL);
const hasMeili = Boolean(map.MEILISEARCH_HOST);
console.log("[pull-vercel-env] OK", out, lines.length, "keys");
console.log("[pull-vercel-env] DATABASE_URL:", hasDb ? "ok" : "eksik");
console.log("[pull-vercel-env] MEILISEARCH_HOST:", hasMeili ? "ok" : "eksik");
