/**

 * Vercel build — canlı public: E-TICARET/site (AGENTS.md).

 * Next app (app/, lib/, …) git'te çoğunlukla EQUSTO-WORK/E-TICARET/site altında;

 * eksikse build öncesi oradan hydrate edilir.

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



/** Public + package.json kaynağı — her zaman E-TICARET/site. */

export function resolveCanonicalSite(repo) {

  const canonical = path.join(repo, "E-TICARET", "site");

  if (!fs.existsSync(path.join(canonical, "package.json"))) {

    console.error("[vercel-sync] E-TICARET/site/package.json yok:", canonical);

    process.exit(1);

  }

  return canonical;

}



export function resolveDonorSite(repo) {

  const donor = path.join(repo, "EQUSTO-WORK", "E-TICARET", "site");

  if (isNextSite(donor) && hasFullNextApp(donor)) return donor;

  return null;

}



/**

 * Root Directory = E-TICARET/site iken: public burada, app/ eksikse EQUSTO-WORK'ten doldur.

 */

export function materializeVercelRoot(vercelRoot) {

  const repo = findRepoRoot(vercelRoot);

  const canonical = resolveCanonicalSite(repo);

  const donor = resolveDonorSite(repo);

  const root = path.resolve(vercelRoot);

  const canon = path.resolve(canonical);



  function hydrateFromDonor(target) {

    if (hasFullNextApp(target)) return;

    if (!donor) {

      console.error(

        "[vercel-sync] E-TICARET/site tam Next app degil (layout.tsx yok) ve EQUSTO-WORK yedek bulunamadi.",

        "\n  hedef:", target,

        "\n  canonical:", canon

      );

      process.exit(1);

    }

    console.log(

      "[vercel-sync] hydrate app/lib:",

      path.relative(repo, donor),

      "->",

      path.relative(repo, target)

    );

    syncAppStack(donor, target);

    restoreCanonicalVercelScripts(canonical, target);

    syncPublic(canonical, target);

    if (!hasFullNextApp(target)) {

      console.error("[vercel-sync] hydrate sonrasi app/ hala eksik:", target);

      process.exit(1);

    }

  }



  if (root === canon) {

    hydrateFromDonor(root);

    console.log("[vercel-sync] OK —", root);

    return root;

  }



  if (!isNextSite(root)) {

    const appSrc = hasFullNextApp(canon) ? canon : donor;

    if (!appSrc) {

      console.error("[vercel-sync] Materialize icin tam app kaynagi yok");

      process.exit(1);

    }

    console.log("[vercel-sync] Materialize:", path.relative(repo, appSrc), "->", path.relative(repo, root));

    copyFullSite(appSrc, root);

    syncPublic(canonical, root);

    return root;

  }



  hydrateFromDonor(root);

  if (root !== canon) {

    console.log("[vercel-sync] public/ <- E-TICARET/site");

    syncPublic(canonical, root);

  }



  console.log("[vercel-sync] OK —", root);

  return root;

}



/** Donor scripts/ kopyasi bunlari ezmesin — canli build mantigi E-TICARET/site'ta kalir. */
const CANONICAL_VERCEL_SCRIPTS = [
  "vercel-site-sync.mjs",
  "vercel-build.mjs",
  "vercel-install.mjs",
  "vercel-resolve-site.mjs",
];

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



function restoreCanonicalVercelScripts(canonSite, dest) {
  for (const name of CANONICAL_VERCEL_SCRIPTS) {
    const from = path.join(canonSite, "scripts", name);
    const to = path.join(dest, "scripts", name);
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
  }
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

