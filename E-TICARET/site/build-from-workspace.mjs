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

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(path.join(site, "package.json"))) {
  console.error("[build-from-workspace] Site bulunamadi:", site);
  console.error("Vercel Root Directory = EQUSTO-WORK/E-TICARET/site yapin.");
  process.exit(1);
}

run("npm", ["ci"], site);
run("node", ["scripts/generate-admin-config.mjs"], site);
run("npx", ["prisma", "generate"], site);
run("npm", ["run", "build"], site);

const srcNext = path.join(site, ".next");
const destNext = path.join(here, ".next");
if (fs.existsSync(destNext)) fs.rmSync(destNext, { recursive: true, force: true });
fs.cpSync(srcNext, destNext, { recursive: true });

const srcPublic = path.join(site, "public");
const destPublic = path.join(here, "public");
if (fs.existsSync(destPublic)) fs.rmSync(destPublic, { recursive: true, force: true });
fs.cpSync(srcPublic, destPublic, { recursive: true });

console.log("[build-from-workspace] OK →", here);
