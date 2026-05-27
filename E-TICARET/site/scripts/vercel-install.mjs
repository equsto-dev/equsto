/**
 * npm ci — E-TICARET/site (tek kaynak).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const siteDir = materializeVercelRoot(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
);

const pre = spawnSync(process.execPath, ["scripts/vercel-prebuild.mjs"], {
  cwd: siteDir,
  stdio: "inherit",
});
if (pre.status !== 0) process.exit(pre.status ?? 1);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

console.log("[vercel-install] npm ci →", siteDir);
const r = spawnSync(npm, ["ci"], {
  cwd: siteDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
