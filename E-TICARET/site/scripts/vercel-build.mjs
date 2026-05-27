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

patchPrismaSchemaForVercel(siteDir);

fs.writeFileSync(
  path.join(siteDir, "lib/prisma.vercel.ts"),
  'export { PrismaClient, Prisma } from "@prisma/client";\nexport type * from "@prisma/client";\n'
);

function ensureNextConfigForVercel(dir) {
  const cfgPath = path.join(dir, "next.config.ts");
  let text = fs.readFileSync(cfgPath, "utf8");
  if (!text.includes("market-reyonlari")) {
    text = text.replace(
      '"set-ustu-mutfak": "/set-ustu-mutfak.html",',
      '"set-ustu-mutfak": "/set-ustu-mutfak.html",\n  "market-reyonlari": "/market-reyonlari.html",'
    );
  }
  if (!text.includes("prisma.vercel.ts")) {
    const webpackBlock = `  webpack: (config, { isServer }) => {
    if (process.env.VERCEL && isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        [path.resolve(__dirname, "lib/prisma.ts")]: path.resolve(
          __dirname,
          "lib/prisma.vercel.ts"
        ),
      };
    }
    return config;
  },`;
    text = text.replace(/\n};\n\nexport default nextConfig;/, `\n${webpackBlock}\n};\n\nexport default nextConfig;`);
  }
  fs.writeFileSync(cfgPath, text);
}

ensureNextConfigForVercel(siteDir);

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
