/**
 * npm ci — E-TICARET/site icinde tam Next.js (materialize + ci).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const vercelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = materializeVercelRoot(vercelRoot);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

console.log("[vercel-install] npm ci →", siteDir);
const r = spawnSync(npm, ["ci"], { cwd: siteDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
