/**
 * Vercel build — panelde Root Directory aranmaz.
 * equsto-v2, E-TICARET/site, EQUSTO-WORK/E-TICARET/site veya repo kökü olabilir.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vercelRoot = path.resolve(scriptDir, "..");

function isNextSite(dir) {
  return (
    fs.existsSync(path.join(dir, "package.json")) &&
    fs.existsSync(path.join(dir, "app"))
  );
}

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (
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
  if (isNextSite(root)) return root;

  const repo = findRepoRoot(root);
  const candidates = [
    path.join(repo, "E-TICARET", "site"),
    path.join(repo, "EQUSTO-WORK", "E-TICARET", "site"),
  ].filter(isNextSite);

  if (candidates.length === 0) {
    console.error("[vercel-build] Next.js site bulunamadi. root=", root, "repo=", repo);
    process.exit(1);
  }
  return candidates[0];
}

const siteDir = resolveSiteDir(vercelRoot);

if (siteDir !== vercelRoot) {
  console.log("[vercel-build] Vercel cwd:", vercelRoot);
  console.log("[vercel-build] Build site:", siteDir);
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: cmd === npx,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(path.join(siteDir, "node_modules"))) {
  run(npm, ["ci"], siteDir);
}

run(process.execPath, ["scripts/generate-admin-config.mjs"], siteDir);
run(npx, ["--no-install", "prisma", "generate"], siteDir);
run(npx, ["--no-install", "next", "build"], siteDir);

if (path.resolve(siteDir) !== path.resolve(vercelRoot)) {
  for (const name of [".next", "public"]) {
    const src = path.join(siteDir, name);
    const dest = path.join(vercelRoot, name);
    if (!fs.existsSync(src)) {
      console.error("[vercel-build] Eksik:", src);
      process.exit(1);
    }
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
  }
  console.log("[vercel-build] Cikti Vercel root'a kopyalandi:", vercelRoot);
}

console.log("[vercel-build] OK");
