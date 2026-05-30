/**
 * Vercel install/build — tek kaynak: E-TICARET/site
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
  const resolved = path.resolve(start);
  if (isNextSite(resolved)) {
    const parent = path.dirname(resolved);
    if (path.basename(parent) === "E-TICARET") {
      const repo = path.dirname(parent);
      if (fs.existsSync(path.join(repo, "E-TICARET", "site", "package.json"))) {
        return repo;
      }
    }
  }
  let dir = resolved;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, "E-TICARET", "site", "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolved;
}

export function resolveSiteDir(root) {
  const repo = findRepoRoot(root);
  const canonical = path.join(repo, "E-TICARET", "site");
  if (isNextSite(canonical)) return canonical;

  if (isNextSite(root)) return root;

  console.error("[vercel] E-TICARET/site bulunamadi. root=", root, "repo=", repo);
  process.exit(1);
}
