/**
 * Docker / Hetzner build — prebuild + admin-config + next build (standalone).
 * Vercel'e özgü .next → repo kökü kopyası yok.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureAssetCdnEnv } from "./lib/asset-cdn-base.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

process.env.DOCKER_BUILD = "1";
ensureAssetCdnEnv(siteDir);
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function runNode(script) {
  const r = spawnSync(process.execPath, [script], {
    cwd: siteDir,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("[docker-ci] site:", siteDir);
runNode("scripts/vercel-prebuild.mjs");
runNode("scripts/generate-admin-config.mjs");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npm, ["run", "build"], {
  cwd: siteDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if (build.status !== 0) process.exit(build.status ?? 1);

console.log("[docker-ci] OK");
