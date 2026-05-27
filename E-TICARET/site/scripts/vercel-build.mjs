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
  const repo = findRepoRoot(root);
  const canonical = path.join(repo, "E-TICARET", "site");
  if (isNextSite(canonical)) return canonical;
  if (isNextSite(root)) return root;
  const alt = path.join(repo, "EQUSTO-WORK", "E-TICARET", "site");
  if (isNextSite(alt)) return alt;
  console.error("[vercel-build] Next.js site bulunamadi. root=", root, "repo=", repo);
  process.exit(1);
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

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function hasLocalBin(root, name) {
  const dir = path.join(root, "node_modules", ".bin");
  return (
    fs.existsSync(path.join(dir, name)) ||
    fs.existsSync(path.join(dir, `${name}.cmd`))
  );
}

function binPath(root, name) {
  const plain = path.join(root, "node_modules", ".bin", name);
  const cmd = `${plain}.cmd`;
  if (fs.existsSync(plain)) return plain;
  if (fs.existsSync(cmd)) return cmd;
  return plain;
}

let toolRoot = hasLocalBin(siteDir, "prisma")
  ? siteDir
  : hasLocalBin(vercelRoot, "prisma")
    ? vercelRoot
    : null;

if (!toolRoot) {
  console.log("[vercel-build] npm ci →", siteDir);
  run(npm, ["ci"], siteDir);
  toolRoot = siteDir;
} else if (toolRoot !== siteDir) {
  console.log("[vercel-build] node_modules:", toolRoot, "(build cwd:", siteDir, ")");
}

run(process.execPath, [path.join(siteDir, "scripts/generate-admin-config.mjs")], siteDir);
run(binPath(toolRoot, "prisma"), ["generate"], siteDir);
run(binPath(toolRoot, "next"), ["build"], siteDir);

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
