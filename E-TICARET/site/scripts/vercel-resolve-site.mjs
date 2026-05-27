/**
 * Vercel install/build ÔÇö tek kaynak: E-TICARET/site (equsto-v2 yedek kopya, build etme).
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

/** Canl─▒ site ÔÇö her zaman E-TICARET/site. */
export function resolveSiteDir(root) {
  const repo = findRepoRoot(root);
  const canonical = path.join(repo, "E-TICARET", "site");
  if (isNextSite(canonical)) return canonical;

  const legacy = path.join(repo, "EQUSTO-WORK", "E-TICARET", "site");
  if (isNextSite(legacy)) return legacy;

  if (isNextSite(root)) return root;

  console.error("[vercel] E-TICARET/site bulunamadi. root=", root, "repo=", repo);
  process.exit(1);
}
