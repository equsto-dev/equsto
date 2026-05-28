/**
 * Vercel tek giris — prebuild, admin-config, next build, .next → repo koku (tam kopya).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = findRepoRoot(siteDir);

process.env.VERCEL = "1";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build?schema=public";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function runNode(script) {
  const r = spawnSync(process.execPath, [script], {
    cwd: siteDir,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function publishNextAtRepoRoot() {
  const siteNext = path.join(siteDir, ".next");
  const rootNext = path.join(repo, ".next");
  if (path.resolve(repo) === path.resolve(siteDir)) return;

  if (!fs.existsSync(siteNext)) {
    console.error("[vercel-ci] HATA: site .next yok:", siteNext);
    process.exit(1);
  }
  if (fs.existsSync(rootNext)) fs.rmSync(rootNext, { recursive: true, force: true });
  fs.cpSync(siteNext, rootNext, { recursive: true });

  const manifest = path.join(rootNext, "routes-manifest-deterministic.json");
  if (!fs.existsSync(manifest)) {
    console.error("[vercel-ci] HATA:", manifest);
    process.exit(1);
  }
  console.log("[vercel-ci] .next yayinlandi:", rootNext);
}

console.log("[vercel-ci] site:", siteDir, "| repo:", repo);
runNode("scripts/vercel-prebuild.mjs");
runNode("scripts/generate-admin-config.mjs");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npm, ["run", "build"], {
  cwd: siteDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if (build.status !== 0) process.exit(build.status ?? 1);

publishNextAtRepoRoot();
console.log("[vercel-ci] OK");
