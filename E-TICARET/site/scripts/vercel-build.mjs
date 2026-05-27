/**
 * Vercel build — Root Directory genelde E-TICARET/site; kaynak equsto-v2.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vercelRoot = path.resolve(scriptDir, "..");
const siteDir = materializeVercelRoot(vercelRoot);

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

if (!hasLocalBin(siteDir, "prisma")) {
  console.log("[vercel-build] npm ci →", siteDir);
  run(npm, ["ci"], siteDir);
}

run(process.execPath, [path.join(siteDir, "scripts/generate-admin-config.mjs")], siteDir);
run(binPath(siteDir, "prisma"), ["generate"], siteDir);
run(binPath(siteDir, "next"), ["build"], siteDir);

console.log("[vercel-build] OK", siteDir);
