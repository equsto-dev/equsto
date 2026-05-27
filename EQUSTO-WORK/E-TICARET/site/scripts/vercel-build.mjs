/**
 * Vercel Production build (Root: EQUSTO-WORK/E-TICARET/site)
 */
import { spawnSync } from "node:child_process";

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(process.execPath, ["scripts/generate-admin-config.mjs"]);
/** Yerel prisma CLI (package.json) — Vercel'de global prisma@7 uyumsuzluğunu önler */
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
run(npx, ["--no-install", "prisma", "generate"], { shell: true });
run(npx, ["--no-install", "next", "build"], { shell: true });
