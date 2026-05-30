/**
 * EQUSTO-WORK/E-TICARET/site (git) → E-TICARET/site — symlink kopya bozulmasini onler.
 * Kullanim: repo kokunden veya site icinden: node scripts/sync-canonical-app-from-git.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = execSync("git rev-parse --show-toplevel", {
  cwd: siteDir,
  encoding: "utf8",
  env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
}).trim();

const srcPrefix = "EQUSTO-WORK/E-TICARET/site";
const dirs = ["app", "components", "lib", "prisma"];
const files = [
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

function gitLines(args) {
  return execSync(["git", ...args].join(" "), {
    cwd: repo,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
}

function writeFromGit(rel) {
  const buf = execSync(`git show HEAD:${rel}`, {
    cwd: repo,
    maxBuffer: 64 * 1024 * 1024,
  });
  const relUnder = rel.replace(/^EQUSTO-WORK\/E-TICARET\/site\//, "");
  const out = path.join(siteDir, relUnder);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  return out;
}

for (const dir of dirs) {
  const target = path.join(siteDir, dir);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  const listed = gitLines(["ls-tree", "-r", "HEAD", "--name-only", `${srcPrefix}/${dir}`]);
  console.log(`[sync] ${dir}/ → ${listed.length} dosya`);
  for (const rel of listed) writeFromGit(rel);
}

for (const name of files) {
  const rel = `${srcPrefix}/${name}`;
  try {
    writeFromGit(rel);
    console.log(`[sync] ${name}`);
  } catch {
    console.warn(`[sync] atlandi: ${name}`);
  }
}

if (!fs.existsSync(path.join(siteDir, "app", "layout.tsx"))) {
  console.error("[sync] app/layout.tsx yok — basarisiz");
  process.exit(1);
}
console.log("[sync] OK —", siteDir);
