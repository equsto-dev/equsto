/**
 * Vercel Production build (Root: EQUSTO-WORK/E-TICARET/site)
 */
import { spawnSync } from "node:child_process";

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env, shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("node", ["scripts/generate-admin-config.mjs"]);
/** package.json: prisma generate && next build — yerel prisma, npx global 7 değil */
run(npm, ["run", "build"]);
