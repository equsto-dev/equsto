/**
 * npm ci — Vercel root'ta tam site materialize edildikten sonra.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeVercelRoot } from "./vercel-site-sync.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vercelRoot = path.resolve(scriptDir, "..");
const siteDir = materializeVercelRoot(vercelRoot);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
console.log("[vercel-install] npm ci →", siteDir);
const r = spawnSync(npm, ["ci"], { cwd: siteDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
