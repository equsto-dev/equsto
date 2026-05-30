/**
 * Vercel Root Directory = E-TICARET/site iken gercek Next.js projesini build eder.
 * Kalici cozum: Vercel panel → Root Directory = EQUSTO-WORK/E-TICARET/site
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../EQUSTO-WORK/E-TICARET/site");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/postgres";
  process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (r.status !== 0) {
    console.error(`[build-from-workspace] failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

const pkg = path.join(site, "package.json");
if (!fs.existsSync(pkg)) {
  console.error("[build-from-workspace] Site bulunamadi:", site);
  console.error("Vercel Root Directory = EQUSTO-WORK/E-TICARET/site yapin.");
  process.exit(1);
}

console.log("[build-from-workspace] Building", site);
run(npm, ["ci"], site);
run("node", ["scripts/generate-admin-config.mjs"], site);
run(npx, ["prisma", "generate"], site);
run(npm, ["run", "build"], site);

const srcNext = path.join(site, ".next");
const destNext = path.join(here, ".next");
if (!fs.existsSync(srcNext)) {
  console.error("[build-from-workspace] .next yok:", srcNext);
  process.exit(1);
}
if (fs.existsSync(destNext)) fs.rmSync(destNext, { recursive: true, force: true });
fs.cpSync(srcNext, destNext, { recursive: true });

const destPublic = path.join(here, "public");
if (fs.existsSync(destPublic)) fs.rmSync(destPublic, { recursive: true, force: true });
fs.cpSync(path.join(site, "public"), destPublic, { recursive: true });

console.log("[build-from-workspace] OK");
