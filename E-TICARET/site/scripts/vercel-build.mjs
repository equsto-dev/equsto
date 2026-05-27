/**
 * Vercel Production build.
 * Root Directory = EQUSTO-WORK/E-TICARET/site veya eski E-TICARET/site olabilir.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vercelRoot = path.resolve(scriptDir, "..");
const workspaceSite = path.resolve(vercelRoot, "../../EQUSTO-WORK/E-TICARET/site");

function isNextSite(dir) {
  return (
    fs.existsSync(path.join(dir, "package.json")) &&
    fs.existsSync(path.join(dir, "app"))
  );
}

const siteDir =
  isNextSite(vercelRoot) && !isNextSite(workspaceSite)
    ? vercelRoot
    : isNextSite(workspaceSite)
      ? workspaceSite
      : vercelRoot;

if (siteDir !== vercelRoot) {
  console.log("[vercel-build] Vercel root:", vercelRoot);
  console.log("[vercel-build] Building workspace site:", siteDir);
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: siteDir,
    stdio: "inherit",
    env: process.env,
    shell: false,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(process.execPath, ["scripts/generate-admin-config.mjs"]);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
run(npx, ["--no-install", "prisma", "generate"], { shell: true });
run(npx, ["--no-install", "next", "build"], { shell: true });

if (siteDir !== vercelRoot) {
  const srcNext = path.join(siteDir, ".next");
  const destNext = path.join(vercelRoot, ".next");
  if (!fs.existsSync(srcNext)) {
    console.error("[vercel-build] .next yok:", srcNext);
    process.exit(1);
  }
  if (fs.existsSync(destNext)) fs.rmSync(destNext, { recursive: true, force: true });
  fs.cpSync(srcNext, destNext, { recursive: true });
  const destPublic = path.join(vercelRoot, "public");
  if (fs.existsSync(destPublic)) fs.rmSync(destPublic, { recursive: true, force: true });
  fs.cpSync(path.join(siteDir, "public"), destPublic, { recursive: true });
  console.log("[vercel-build] .next ve public Vercel root'a kopyalandi");
}
