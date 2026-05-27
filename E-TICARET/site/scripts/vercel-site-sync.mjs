/**
 * Vercel Root = E-TICARET/site iken tam Next.js kaynagini (equsto-v2) materialize eder.
 */
import fs from "node:fs";
import path from "node:path";

export function isNextSite(dir) {
  return (
    fs.existsSync(path.join(dir, "package.json")) &&
    fs.existsSync(path.join(dir, "app"))
  );
}

export function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (
      fs.existsSync(path.join(dir, "equsto-v2", "package.json")) ||
      fs.existsSync(path.join(dir, "E-TICARET", "site", "package.json")) ||
      fs.existsSync(path.join(dir, "EQUSTO-WORK", "E-TICARET", "site", "package.json"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start, "../..");
}

export function resolveCanonicalSource(repo) {
  const candidates = [
    path.join(repo, "equsto-v2"),
    path.join(repo, "EQUSTO-WORK", "E-TICARET", "site"),
  ];
  return candidates.find(isNextSite) ?? null;
}

const SYNC_DIRS = ["app", "components", "lib", "prisma"];
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

/** Vercel cwd'de app/ yoksa canonical kaynaktan kodu kopyala */
export function materializeVercelRoot(vercelRoot) {
  if (isNextSite(vercelRoot)) return vercelRoot;

  const repo = findRepoRoot(vercelRoot);
  const src = resolveCanonicalSource(repo);
  if (!src) {
    console.error("[vercel-sync] Kaynak site bulunamadi, repo=", repo);
    process.exit(1);
  }

  console.log("[vercel-sync] Materialize:", src, "→", vercelRoot);

  for (const name of SYNC_DIRS) {
    const from = path.join(src, name);
    if (fs.existsSync(from)) copyTree(from, path.join(vercelRoot, name));
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

  const scriptsSrc = path.join(src, "scripts");
  const scriptsDest = path.join(vercelRoot, "scripts");
  fs.mkdirSync(scriptsDest, { recursive: true });
  for (const name of [
    "generate-admin-config.mjs",
    "prisma-postinstall-skip.mjs",
    "load-env.mjs",
  ]) {
    const from = path.join(scriptsSrc, name);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(scriptsDest, name));
  }

  if (!isNextSite(vercelRoot)) {
    console.error("[vercel-sync] Materialize sonrasi app/ hala yok:", vercelRoot);
    process.exit(1);
  }

  return vercelRoot;
}
