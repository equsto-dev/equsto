/**
 * Vercel monorepo: Next .next site icinde, paketleyici repo kokunde arar.
 * Build sonrasi E-TICARET/site/.next → <repo>/.next
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
  console.error("[vercel-postbuild] HATA: site .next yok:", siteNext);
  process.exit(1);
}

if (path.resolve(repo) === path.resolve(siteDir)) {
  console.log("[vercel-postbuild] site = repo root, kopya gerekmez");
  process.exit(0);
}

if (fs.existsSync(rootNext)) fs.rmSync(rootNext, { recursive: true, force: true });
fs.cpSync(siteNext, rootNext, { recursive: true });

const manifest = path.join(rootNext, "routes-manifest-deterministic.json");
if (!fs.existsSync(manifest)) {
  console.error("[vercel-postbuild] HATA: routes-manifest yok:", manifest);
  process.exit(1);
}

console.log("[vercel-postbuild] OK — .next:", siteNext, "→", rootNext);
