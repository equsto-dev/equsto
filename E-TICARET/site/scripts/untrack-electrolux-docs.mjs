/**
 * Electrolux docs (~4 GB) Git index'ten çıkar — disk + S3 kalır.
 * Kaynak: PFOS/veri/electrolux-professional/media/documents/
 *
 *   node scripts/untrack-electrolux-docs.mjs --dry-run
 *   node scripts/untrack-electrolux-docs.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteDir, "../..");
const prefix = "E-TICARET/site/public/data/electrolux-professional/docs/";
const dryRun = process.argv.includes("--dry-run");

function git(args) {
  return spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
}

const listed = git(["ls-files", "--", prefix]);
if (listed.status !== 0) {
  console.error("[untrack-electrolux-docs] git ls-files hata");
  process.exit(1);
}

const files = (listed.stdout || "").split("\n").filter(Boolean);
console.log("[untrack-electrolux-docs] tracked docs:", files.length);

if (!files.length) {
  console.log("[untrack-electrolux-docs] zaten untrack — .gitignore:", prefix);
  process.exit(0);
}

const diskDir = path.join(siteDir, "public/data/electrolux-professional/docs");
console.log("[untrack-electrolux-docs] disk:", fs.existsSync(diskDir) ? "OK" : "YOK");

if (dryRun) {
  console.log("[untrack-electrolux-docs] dry-run — manifest.json git'te kalır");
  process.exit(0);
}

const chunk = 300;
for (let i = 0; i < files.length; i += chunk) {
  const slice = files.slice(i, i + chunk);
  const r = git(["rm", "--cached", "-r", "--", ...slice]);
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  console.log("[untrack-electrolux-docs]", Math.min(i + chunk, files.length), "/", files.length);
}

console.log("[untrack-electrolux-docs] tamam — yeniden import: npm run catalog:electrolux:import");
