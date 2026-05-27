/**
 * Vercel Production build (Root Directory: E-TICARET/site).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

process.env.VERCEL = "1";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function patchPrismaSchemaForVercel(dir) {
  const schemaPath = path.join(dir, "prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) return;
  const text = fs.readFileSync(schemaPath, "utf8");
  const next = text.replace(/\s*output\s*=\s*"\.\/generated\/client"\s*\n/, "\n");
  if (next !== text) {
    fs.writeFileSync(schemaPath, next);
    console.log("[vercel-build] Prisma schema → @prisma/client");
  }
}

function patchPrismaLibForVercel(dir) {
  fs.writeFileSync(
    path.join(dir, "lib/prisma.ts"),
    '/** Vercel build */\nexport { PrismaClient, Prisma } from "@prisma/client";\nexport type * from "@prisma/client";\n'
  );
}

patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform !== "win32";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: useShell && (cmd === npx || cmd.endsWith("npx.cmd")),
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(path.join(siteDir, "node_modules", ".bin", "next"))) {
  console.log("[vercel-build] npm ci");
  run(npm, ["ci"], siteDir);
}

run(process.execPath, ["scripts/generate-admin-config.mjs"], siteDir);
run(npx, ["--no-install", "prisma", "generate"], siteDir);
run(npx, ["--no-install", "next", "build"], siteDir);

console.log("[vercel-build] OK");
