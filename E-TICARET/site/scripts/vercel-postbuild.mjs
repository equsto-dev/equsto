/**
 * Vercel monorepo: paketleyici repo kokunde .next arar (path0/.next).
 * Build: E-TICARET/site/.next → symlink veya kopya → <repo>/.next
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = findRepoRoot(siteDir);
const siteNext = path.join(siteDir, ".next");
const rootNext = path.join(repo, ".next");

console.log("[vercel-postbuild] siteDir:", siteDir);
console.log("[vercel-postbuild] repo:", repo);
console.log("[vercel-postbuild] siteNext:", siteNext);

if (!fs.existsSync(siteNext)) {
  console.error("[vercel-postbuild] HATA: site .next yok");
  process.exit(1);
}

if (path.resolve(repo) === path.resolve(siteDir)) {
  console.log("[vercel-postbuild] site = repo root, atlaniyor");
  process.exit(0);
}

if (fs.existsSync(rootNext)) {
  fs.rmSync(rootNext, { recursive: true, force: true });
}

const relFromRepo = path.relative(repo, siteNext).split(path.sep).join("/");

if (process.platform === "win32") {
  fs.cpSync(siteNext, rootNext, { recursive: true });
} else {
  fs.symlinkSync(relFromRepo, rootNext, "dir");
}

const manifest = path.join(rootNext, "routes-manifest-deterministic.json");
if (!fs.existsSync(manifest)) {
  const names = fs.existsSync(rootNext) ? fs.readdirSync(rootNext).slice(0, 15) : [];
  console.error("[vercel-postbuild] HATA: routes-manifest-deterministic.json yok");
  console.error("[vercel-postbuild] rootNext icerik:", names.join(", "));
  process.exit(1);
}

console.log("[vercel-postbuild] OK —", relFromRepo, "→", rootNext);
