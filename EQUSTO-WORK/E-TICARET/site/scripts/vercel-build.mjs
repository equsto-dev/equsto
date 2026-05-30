/**
 * Vercel build — Root Directory: E-TICARET/site
 * Standart next build; .next bu dizinde kalır (repo root symlink yok).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const siteDir = materializeVercelRoot(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
);

process.env.VERCEL = "1";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: useShell,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  if (r.error) {
    console.error("[vercel-build]", r.error.message);
    process.exit(1);
  }
}

run(process.execPath, ["scripts/vercel-prebuild.mjs"], siteDir);

const adminCfg = path.join(siteDir, "scripts/generate-admin-config.mjs");
if (fs.existsSync(adminCfg)) run(process.execPath, [adminCfg], siteDir);

console.log("[vercel-build] npm run build →", siteDir);
run(npm, ["run", "build"], siteDir);

const nextDir = path.join(siteDir, ".next");
if (!fs.existsSync(nextDir)) {
  console.error("[vercel-build] HATA: .next yok:", nextDir);
  process.exit(1);
}

console.log("[vercel-build] OK —", nextDir);
