/**
 * Vercel Production build — her zaman E-TICARET/site cwd (NFT yolu duzgun).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const vercelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = materializeVercelRoot(vercelRoot);

process.env.VERCEL = "1";

function patchPrismaSchemaForVercel(dir) {
  const schemaPath = path.join(dir, "prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) return;
  const text = fs.readFileSync(schemaPath, "utf8");
  const next = text.replace(/\s*output\s*=\s*"\.\/generated\/client"\s*\n/, "\n");
  if (next !== text) {
    fs.writeFileSync(schemaPath, next);
    console.log("[vercel-build] Prisma schema → node_modules client");
  }
}

/** Turbopack (Next 16) webpack alias kabul etmez — dogrudan lib/prisma.ts yazar. */
function patchPrismaLibForVercel(dir) {
  const prismaPath = path.join(dir, "lib/prisma.ts");
  fs.writeFileSync(
    prismaPath,
    '/** Vercel build — @prisma/client (custom output NFT kirar) */\n' +
      'export { PrismaClient, Prisma } from "@prisma/client";\n' +
      'export type * from "@prisma/client";\n'
  );
  console.log("[vercel-build] lib/prisma.ts → @prisma/client");
}

function ensureMarketReyonlariRewrite(dir) {
  const cfgPath = path.join(dir, "next.config.ts");
  let text = fs.readFileSync(cfgPath, "utf8");
  if (text.includes("market-reyonlari")) return;
  text = text.replace(
    '"set-ustu-mutfak": "/set-ustu-mutfak.html",',
    '"set-ustu-mutfak": "/set-ustu-mutfak.html",\n  "market-reyonlari": "/market-reyonlari.html",'
  );
  fs.writeFileSync(cfgPath, text);
  console.log("[vercel-build] next.config → market-reyonlari rewrite");
}

patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);
ensureMarketReyonlariRewrite(siteDir);

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

function binPath(root, name) {
  const plain = path.join(root, "node_modules", ".bin", name);
  const cmd = `${plain}.cmd`;
  if (fs.existsSync(plain)) return plain;
  if (fs.existsSync(cmd)) return cmd;
  return plain;
}

if (!fs.existsSync(binPath(siteDir, "next"))) {
  console.log("[vercel-build] npm ci →", siteDir);
  run(npm, ["ci"], siteDir);
}

run(process.execPath, [path.join(siteDir, "scripts/generate-admin-config.mjs")], siteDir);
run(binPath(siteDir, "prisma"), ["generate"], siteDir);
run(binPath(siteDir, "next"), ["build"], siteDir);

console.log("[vercel-build] OK —", siteDir);
