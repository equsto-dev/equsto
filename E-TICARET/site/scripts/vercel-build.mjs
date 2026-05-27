/**
 * Vercel Production build — Root Directory: E-TICARET/site
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

function patchPrismaSchemaForVercel(dir) {
  const schemaPath = path.join(dir, "prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) {
    console.error("[vercel-build] prisma/schema.prisma bulunamadi:", dir);
    process.exit(1);
  }
  const text = fs.readFileSync(schemaPath, "utf8");
  const next = text.replace(/^\s*output\s*=\s*["'][^"']+["']\s*\r?\n/gm, "");
  if (next !== text) {
    fs.writeFileSync(schemaPath, next);
    console.log("[vercel-build] Prisma schema → @prisma/client");
  }
  const genDir = path.join(dir, "prisma", "generated");
  if (fs.existsSync(genDir)) fs.rmSync(genDir, { recursive: true, force: true });
}

function patchPrismaLibForVercel(dir) {
  fs.writeFileSync(
    path.join(dir, "lib/prisma.ts"),
    'export { PrismaClient, Prisma } from "@prisma/client";\nexport type * from "@prisma/client";\n'
  );
}

function patchTsconfigForVercel(dir) {
  const tsPath = path.join(dir, "tsconfig.json");
  if (!fs.existsSync(tsPath)) return;
  let text = fs.readFileSync(tsPath, "utf8");
  const next = text.replace(/,?\s*"@prisma\/client":\s*\["\.\/prisma\/generated\/client"\]/, "");
  if (next !== text) fs.writeFileSync(tsPath, next);
}

patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);
patchTsconfigForVercel(siteDir);

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

if (!fs.existsSync(path.join(siteDir, "node_modules", ".bin", "next"))) {
  console.log("[vercel-build] npm ci →", siteDir);
  run(npm, ["ci"], siteDir);
}

const adminCfg = path.join(siteDir, "scripts/generate-admin-config.mjs");
if (fs.existsSync(adminCfg)) run(process.execPath, [adminCfg], siteDir);

console.log("[vercel-build] npm run build →", siteDir);
run(npm, ["run", "build"], siteDir);

console.log("[vercel-build] OK —", siteDir);
