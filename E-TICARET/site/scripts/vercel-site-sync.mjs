/**
 * Vercel build — tek kaynak: E-TICARET/site (AGENTS.md).
 * Repo kokunden calisirsa yine ayni dizin cozulur; EQUSTO-WORK kopyasi kullanilmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

export { findRepoRoot };

export function hasFullNextApp(dir) {
  return (
    fs.existsSync(path.join(dir, "app", "layout.tsx")) ||
    fs.existsSync(path.join(dir, "app", "(storefront)"))
  );
}

export function resolveCanonicalSite(repo) {
  const canonical = path.join(repo, "E-TICARET", "site");
  if (!fs.existsSync(path.join(canonical, "package.json"))) {
    console.error("[vercel-sync] E-TICARET/site/package.json yok:", canonical);
    process.exit(1);
  }
  return canonical;
}

/** @param {string} vercelRoot scripts/.. veya E-TICARET/site */
export function materializeVercelRoot(vercelRoot) {
  const repo = findRepoRoot(vercelRoot);
  const canonical = resolveCanonicalSite(repo);
  const root = path.resolve(vercelRoot);
  const canon = path.resolve(canonical);

  const site =
    root === canon || root.startsWith(canon + path.sep) ? root : canon;

  if (!hasFullNextApp(site)) {
    console.error(
      "[vercel-sync] Tam Next app gerekli (app/layout.tsx). E-TICARET/site icine app/ commit edin:",
      site
    );
    process.exit(1);
  }

  console.log("[vercel-sync] OK — tek kaynak:", site);
  return site;
}
