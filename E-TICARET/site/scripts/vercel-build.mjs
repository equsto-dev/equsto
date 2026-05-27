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
  const libPath = path.join(dir, "lib/prisma.ts");
  if (!fs.existsSync(path.join(dir, "lib"))) return;
  fs.writeFileSync(
    libPath,
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

const adminCfg = path.join(siteDir, "scripts/generate-admin-config.mjs");
if (fs.existsSync(adminCfg)) run(process.execPath, [adminCfg], siteDir);

console.log("[vercel-build] npm run build →", siteDir);
run(npm, ["run", "build"], siteDir);

// Vercel .next çıktısını repo root'ta arar — symlink ile yönlendir
const repoRoot = path.resolve(siteDir, "../..");
const siteNext = path.join(siteDir, ".next");
const rootNext = path.join(repoRoot, ".next");
if (fs.existsSync(siteNext) && !fs.existsSync(rootNext)) {
  fs.symlinkSync(siteNext, rootNext, "junction");
  console.log("[vercel-build] .next symlink →", rootNext);
} else if (!fs.existsSync(siteNext)) {
  console.error("[vercel-build] HATA: .next dizini bulunamadi:", siteNext);
  process.exit(1);
}

console.log("[vercel-build] OK —", siteDir);
