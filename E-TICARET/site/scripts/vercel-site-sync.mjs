/**
 * Vercel build — tek kaynak: E-TICARET/site (AGENTS.md).
 * EQUSTO-WORK/E-TICARET/site ve equsto-v2 yedek; canlı build bunları kullanmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot, isNextSite } from "./vercel-resolve-site.mjs";

export { isNextSite, findRepoRoot };

export function hasFullNextApp(dir) {
  return (
    fs.existsSync(path.join(dir, "app", "layout.tsx")) ||
    fs.existsSync(path.join(dir, "app", "(storefront)"))
  );
}

/** Canlı site dizini — her zaman E-TICARET/site. */
export function resolveCanonicalSite(repo) {
  const canonical = path.join(repo, "E-TICARET", "site");
  if (isNextSite(canonical)) return canonical;
  console.error("[vercel-sync] E-TICARET/site bulunamadi:", canonical);
  process.exit(1);
}

/**
 * Root Directory = E-TICARET/site iken kopyalama yok (hizli, tek kaynak).
 * Repo kokunden build (nadir) ise tam site buraya materialize edilir.
 */
export function materializeVercelRoot(vercelRoot) {
  const repo = findRepoRoot(vercelRoot);
  const canonical = resolveCanonicalSite(repo);
  const root = path.resolve(vercelRoot);
  const canon = path.resolve(canonical);

  if (root === canon && isNextSite(root) && hasFullNextApp(root)) {
    console.log("[vercel-sync] OK — tek kaynak:", root);
    return root;
  }

  if (!isNextSite(canon) || !hasFullNextApp(canon)) {
    console.error("[vercel-sync] E-TICARET/site tam Next app degil (app/layout.tsx gerekli):", canon);
    process.exit(1);
  }

  if (!isNextSite(root)) {
    console.log("[vercel-sync] Materialize:", canon, "->", root);
    copyFullSite(canon, root);
    return root;
  }

  if (!hasFullNextApp(root)) {
    console.log("[vercel-sync] Eksik app/ — E-TICARET/site ile tamamlaniyor");
    syncAppStack(canon, root);
    syncPublic(canon, root);
  } else if (root !== canon) {
    console.log("[vercel-sync] public/ guncelleniyor:", canon);
    syncPublic(canon, root);
  }

  if (!hasFullNextApp(root)) {
    console.error("[vercel-sync] Materialize sonrasi app/ hala eksik:", root);
    process.exit(1);
  }

  return root;
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
  "vercel.json",
];

function copyTree(src, dest) {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

function syncPublic(src, dest) {
  const publicSrc = path.join(src, "public");
  if (!fs.existsSync(publicSrc)) return;
  fs.cpSync(publicSrc, path.join(dest, "public"), { recursive: true, force: true });
}

function syncAppStack(src, dest) {
  for (const name of SYNC_DIRS) {
    const from = path.join(src, name);
    if (fs.existsSync(from)) copyTree(from, path.join(dest, name));
  }
  for (const name of SYNC_FILES) {
    const from = path.join(src, name);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dest, name));
  }
  const scriptsSrc = path.join(src, "scripts");
  const scriptsDest = path.join(dest, "scripts");
  if (fs.existsSync(scriptsSrc)) {
    fs.mkdirSync(scriptsDest, { recursive: true });
    fs.cpSync(scriptsSrc, scriptsDest, { recursive: true, force: true });
  }
}

function copyFullSite(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  syncAppStack(src, dest);
  syncPublic(src, dest);
}
