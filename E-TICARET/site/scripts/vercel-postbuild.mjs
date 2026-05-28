/**
 * Build sonrasi .next → repo koku (tam kopya, symlink yok).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = findRepoRoot(siteDir);
const siteNext = path.join(siteDir, ".next");
const rootNext = path.join(repo, ".next");

if (!fs.existsSync(siteNext)) {
  console.error("[vercel-postbuild] HATA: site .next yok");
  process.exit(1);
}
if (path.resolve(repo) === path.resolve(siteDir)) process.exit(0);

if (fs.existsSync(rootNext)) fs.rmSync(rootNext, { recursive: true, force: true });
fs.cpSync(siteNext, rootNext, { recursive: true });

if (!fs.existsSync(path.join(rootNext, "routes-manifest-deterministic.json"))) {
  console.error("[vercel-postbuild] HATA: routes-manifest-deterministic.json yok");
  process.exit(1);
}
console.log("[vercel-postbuild] OK — kopya:", rootNext);
