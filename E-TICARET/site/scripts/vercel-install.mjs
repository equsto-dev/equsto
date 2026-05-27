/**
 * npm ci — guncel E-TICARET/site.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSiteDir } from "./vercel-resolve-site.mjs";

const vercelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = resolveSiteDir(vercelRoot);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

if (path.resolve(siteDir) !== path.resolve(vercelRoot)) {
  console.log("[vercel-install] cwd:", vercelRoot, "→ site:", siteDir);
}

console.log("[vercel-install] npm ci →", siteDir);
const r = spawnSync(npm, ["ci"], { cwd: siteDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
