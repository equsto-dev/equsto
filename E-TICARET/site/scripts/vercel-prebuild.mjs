/**
 * Vercel build öncesi — Prisma + tsconfig (Turbopack uyumlu).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function patchPrismaSchemaForVercel(dir) {
  const schemaPath = path.join(dir, "prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) return;
  const text = fs.readFileSync(schemaPath, "utf8");
  const next = text.replace(/^\s*output\s*=\s*["'][^"']+["']\s*\r?\n/gm, "");
  if (next !== text) {
    fs.writeFileSync(schemaPath, next);
    console.log("[vercel-prebuild] Prisma schema → @prisma/client");
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

/** Yerel: imports → prisma/generated; Vercel: node_modules/.prisma/client */
function patchPackageJsonForVercel(dir) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.imports?.["@prisma/client"]?.includes("prisma/generated")) return;
  delete pkg.imports;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("[vercel-prebuild] package.json imports kaldırıldı → @prisma/client");
}

patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);
patchTsconfigForVercel(siteDir);
patchPackageJsonForVercel(siteDir);
console.log("[vercel-prebuild] OK");
