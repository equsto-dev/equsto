/**
 * Vercel Root'ta app/ yoksa tam siteyi EQUSTO-WORK kaynagindan materialize eder.
 */
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot, isNextSite } from "./vercel-resolve-site.mjs";

export { isNextSite, findRepoRoot };

export function resolveCanonicalSource(repo) {
  const candidates = [
    path.join(repo, "EQUSTO-WORK", "E-TICARET", "site"),
    path.join(repo, "equsto-v2"),
    path.join(repo, "E-TICARET", "site"),
  ];
  return candidates.find(isNextSite) ?? null;
}

const SYNC_DIRS = ["app", "components", "lib", "prisma"];
const SYNC_LIB_EXTRA = ["prisma.vercel.ts"];
const SYNC_FILES = [
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "prisma.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "proxy.ts",
  ".npmrc",
];

function copyTree(src, dest) {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

function syncBuildScripts(src, vercelRoot) {
  const scriptsSrc = path.join(src, "scripts");
  const scriptsDest = path.join(vercelRoot, "scripts");
  fs.mkdirSync(scriptsDest, { recursive: true });
  for (const name of [
    "generate-admin-config.mjs",
    "prisma-postinstall-skip.mjs",
    "load-env.mjs",
    "vercel-resolve-site.mjs",
    "vercel-site-sync.mjs",
  ]) {
    const from = path.join(scriptsSrc, name);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(scriptsDest, name));
  }
}

export function materializeVercelRoot(vercelRoot) {
  const repo = findRepoRoot(vercelRoot);
  const src = resolveCanonicalSource(repo);
  if (!src) {
    console.error("[vercel-sync] Kaynak site bulunamadi, repo=", repo);
    process.exit(1);
  }

  if (isNextSite(vercelRoot)) {
    syncBuildScripts(src, vercelRoot);
    return vercelRoot;
  }

  console.log("[vercel-sync] Materialize:", src, "->", vercelRoot);

  for (const name of SYNC_DIRS) {
    const from = path.join(src, name);
    if (fs.existsSync(from)) copyTree(from, path.join(vercelRoot, name));
  }

  for (const name of SYNC_LIB_EXTRA) {
    const from = path.join(src, "lib", name);
    const to = path.join(vercelRoot, "lib", name);
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
  }

  for (const name of SYNC_FILES) {
    const from = path.join(src, name);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(vercelRoot, name));
  }

  const publicSrc = path.join(src, "public");
  if (fs.existsSync(publicSrc)) {
    const publicDest = path.join(vercelRoot, "public");
    fs.mkdirSync(publicDest, { recursive: true });
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  }

  syncBuildScripts(src, vercelRoot);

  if (!isNextSite(vercelRoot)) {
    console.error("[vercel-sync] Materialize sonrasi app/ hala yok:", vercelRoot);
    process.exit(1);
  }

  return vercelRoot;
}
