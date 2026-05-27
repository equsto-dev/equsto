/**
 * Vercel install — npm ci (Root Directory: E-TICARET/site).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

console.log("[vercel-install] npm ci");
const r = spawnSync(npm, ["ci"], { cwd: siteDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
