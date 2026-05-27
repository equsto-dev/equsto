/**
 * Vercel Production build — kaynak: E-TICARET/site (public + market-reyon burada).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSiteDir } from "./vercel-resolve-site.mjs";

const vercelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = resolveSiteDir(vercelRoot);

if (path.resolve(siteDir) !== path.resolve(vercelRoot)) {
  console.log("[vercel-build] cwd:", vercelRoot, "→ build:", siteDir);
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(cmd, args, cwd, shell) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: shell === true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(path.join(siteDir, "node_modules", ".bin", "next"))) {
  console.log("[vercel-build] npm ci →", siteDir);
  run(npm, ["ci"], siteDir, false);
}

run(process.execPath, [path.join(siteDir, "scripts/generate-admin-config.mjs")], siteDir, false);
run(npx, ["--no-install", "prisma", "generate"], siteDir, true);
run(npx, ["--no-install", "next", "build"], siteDir, true);

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
  console.log("[vercel-build] .next + public →", vercelRoot);
}

console.log("[vercel-build] OK —", siteDir);
