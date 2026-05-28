/**
 * Vercel install — eski .next (cache/symlink) sil, sonra npm ci.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = findRepoRoot(siteDir);

for (const target of [path.join(siteDir, ".next"), path.join(repo, ".next")]) {
  if (!fs.existsSync(target)) continue;
  fs.rmSync(target, { recursive: true, force: true });
  console.log("[vercel-install] eski .next silindi:", target);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
console.log("[vercel-install] npm ci →", siteDir);
const r = spawnSync(npm, ["ci"], {
  cwd: siteDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
