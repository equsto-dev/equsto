/**
 * Vercel build — public/ kaynagi E-TICARET/site; app/ tam kopya EQUSTO-WORK veya equsto-v2.
 */
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot, isNextSite } from "./vercel-resolve-site.mjs";

export { isNextSite, findRepoRoot };

const SITE_CANDIDATES = (repo) => [
  path.join(repo, "E-TICARET", "site"),
  path.join(repo, "EQUSTO-WORK", "E-TICARET", "site"),
  path.join(repo, "equsto-v2"),
];

/** Guncel statik dosyalar (kuvetler.html, nav.js, …). */
export function resolvePublicSource(repo) {
  const canonical = path.join(repo, "E-TICARET", "site");
  if (fs.existsSync(path.join(canonical, "public"))) return canonical;
  return SITE_CANDIDATES(repo).find(isNextSite) ?? null;
}

/** Tam Next.js app/ (git’te cogunlukla EQUSTO-WORK altinda). */
export function resolveAppSource(repo) {
  const nested = path.join(repo, "EQUSTO-WORK", "E-TICARET", "site");
  const v2 = path.join(repo, "equsto-v2");
  if (hasFullNextApp(nested)) return nested;
  if (hasFullNextApp(v2)) return v2;
  return SITE_CANDIDATES(repo).find((d) => isNextSite(d) && hasFullNextApp(d)) ?? null;
}

export function resolveCanonicalSource(repo) {
  return resolvePublicSource(repo) ?? resolveAppSource(repo);
}

function hasPrismaSchema(dir) {
  return fs.existsSync(path.join(dir, "prisma", "schema.prisma"));
}

export function hasFullNextApp(dir) {
  return (
    fs.existsSync(path.join(dir, "app", "layout.tsx")) ||
    fs.existsSync(path.join(dir, "app", "(storefront)"))
  );
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

function syncPublicFrom(src, vercelRoot) {
  const publicSrc = path.join(src, "public");
  if (!fs.existsSync(publicSrc)) return;
  const publicDest = path.join(vercelRoot, "public");
  fs.mkdirSync(publicDest, { recursive: true });
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
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

function syncAppStackFrom(src, vercelRoot) {
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
  syncBuildScripts(src, vercelRoot);
}

export function materializeVercelRoot(vercelRoot) {
  const repo = findRepoRoot(vercelRoot);
  const publicSrc = resolvePublicSource(repo);
  const appSrc = resolveAppSource(repo);

  if (!publicSrc && !appSrc) {
    console.error("[vercel-sync] Kaynak site bulunamadi, repo=", repo);
    process.exit(1);
  }

  const stackSrc = appSrc || publicSrc;

  if (isNextSite(vercelRoot)) {
    if (!hasFullNextApp(vercelRoot) && stackSrc && path.resolve(stackSrc) !== path.resolve(vercelRoot)) {
      console.log("[vercel-sync] Eksik app/ — tam stack:", stackSrc);
      syncAppStackFrom(stackSrc, vercelRoot);
    } else {
      syncBuildScripts(stackSrc, vercelRoot);
      if (!hasPrismaSchema(vercelRoot) && stackSrc && hasPrismaSchema(stackSrc)) {
        console.log("[vercel-sync] prisma/ eksik — kaynaktan kopyalaniyor");
        copyTree(path.join(stackSrc, "prisma"), path.join(vercelRoot, "prisma"));
      }
      if (!fs.existsSync(path.join(vercelRoot, "lib", "db.ts")) && stackSrc) {
        const libSrc = path.join(stackSrc, "lib");
        if (fs.existsSync(libSrc)) copyTree(libSrc, path.join(vercelRoot, "lib"));
      }
    }

    if (publicSrc && path.resolve(publicSrc) !== path.resolve(vercelRoot)) {
      console.log("[vercel-sync] public/ →", publicSrc);
      syncPublicFrom(publicSrc, vercelRoot);
    }

    if (!isNextSite(vercelRoot) || !hasFullNextApp(vercelRoot)) {
      console.error("[vercel-sync] Materialize sonrasi tam Next app yok:", vercelRoot);
      process.exit(1);
    }

    return vercelRoot;
  }

  const materializeFrom = stackSrc;
  console.log("[vercel-sync] Materialize:", materializeFrom, "->", vercelRoot);
  syncAppStackFrom(materializeFrom, vercelRoot);
  if (publicSrc) syncPublicFrom(publicSrc, vercelRoot);

  if (!isNextSite(vercelRoot) || !hasFullNextApp(vercelRoot)) {
    console.error("[vercel-sync] Materialize sonrasi app/ hala eksik:", vercelRoot);
    process.exit(1);
  }

  return vercelRoot;
}
