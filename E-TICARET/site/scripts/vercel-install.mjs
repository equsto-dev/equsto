/**
 * npm ci — her zaman guncel E-TICARET/site (equsto-v2 kopyasini atlar).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vercelRoot = path.resolve(scriptDir, "..");

function isNextSite(dir) {
  return fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "app"));
}

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (
      fs.existsSync(path.join(dir, "equsto-v2", "package.json")) ||
      fs.existsSync(path.join(dir, "E-TICARET", "site", "package.json")) ||
      fs.existsSync(path.join(dir, "EQUSTO-WORK", "E-TICARET", "site", "package.json"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start, "../..");
}

function resolveSiteDir(root) {
  const repo = findRepoRoot(root);
  const candidates = [
    path.join(repo, "equsto-v2"),
    path.join(repo, "EQUSTO-WORK", "E-TICARET", "site"),
    path.join(repo, "E-TICARET", "site"),
    root,
  ].filter(isNextSite);

  if (candidates.length === 0) {
    console.error("[vercel-install] Site bulunamadi");
    process.exit(1);
  }
  return candidates[0];
}

const siteDir = resolveSiteDir(vercelRoot);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
console.log("[vercel-install]", siteDir);
const r = spawnSync(npm, ["ci"], { cwd: siteDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
