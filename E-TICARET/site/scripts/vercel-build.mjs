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
    console.log("[vercel-build] Prisma schema → node_modules @prisma/client");
  }
}

function patchPrismaLibForVercel(dir) {
  fs.writeFileSync(
    path.join(dir, "lib/prisma.ts"),
    '/** Vercel build */\nexport { PrismaClient, Prisma } from "@prisma/client";\nexport type * from "@prisma/client";\n'
  );
}

/** tsconfig @prisma/client → generated/client Vercel'de yok; node_modules kullan */
function patchTsconfigForVercel(dir) {
  const tsPath = path.join(dir, "tsconfig.json");
  let text = fs.readFileSync(tsPath, "utf8");
  const next = text.replace(
    /,?\s*"@prisma\/client":\s*\["\.\/prisma\/generated\/client"\]/,
    ""
  );
  if (next !== text) {
    fs.writeFileSync(tsPath, next);
    console.log("[vercel-build] tsconfig paths → node_modules @prisma/client");
  }
}

patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);
patchTsconfigForVercel(siteDir);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (r.status !== 0) {
    console.error(`[vercel-build] failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

if (!fs.existsSync(path.join(siteDir, "node_modules", ".bin", "next"))) {
  console.log("[vercel-build] npm ci");
  run(npm, ["ci"], siteDir);
}

run(process.execPath, [path.join(siteDir, "scripts/generate-admin-config.mjs")], siteDir);
console.log("[vercel-build] npm run build");
run(npm, ["run", "build"], siteDir);

console.log("[vercel-build] OK");
