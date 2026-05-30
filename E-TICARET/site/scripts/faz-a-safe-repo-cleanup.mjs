/**
 * Faz A — Repodan güvenli çıkarma (diskte dosyalar KALIR).
 * Sadece allowlist; yalnızca `git rm --cached`.
 *
 *   node scripts/faz-a-safe-repo-cleanup.mjs --dry-run
 *   node scripts/faz-a-safe-repo-cleanup.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteDir, "../..");
const dryRun = process.argv.includes("--dry-run");

const DIR_UNTRACK = [
  "EQUSTO-WORK/E-TICARET/site",
  "equsto-v2",
  "EQUSTO-WORK/PFOS/kaynaklar",
  "E-TICARET/veri",
];

const FILE_UNTRACK = [
  "E-TICARET/site/public/data/ekipmanlar.json.legacy-off",
  "E-TICARET/site/public/data/pfos-archive-extract.json",
  "E-TICARET/site/public/data/admin-auth.json",
  "E-TICARET/site/public/data/atalay-merge-log.json",
  // KILIT.txt — Git'te KALMALI (vercel-prebuild verify-pdp-kilit / ambient / buzdolap)
];

function git(args, { quiet } = {}) {
  const r = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    if (!quiet) console.error("[faz-a] git", args.join(" "), "\n", r.stderr || r.stdout);
    return null;
  }
  return (r.stdout || "").trim();
}

function countTracked(spec) {
  const out = git(["ls-files", "--", spec], { quiet: true });
  if (out === null) return 0;
  return out ? out.split("\n").length : 0;
}

console.log("[faz-a] repo:", repoRoot);
console.log("[faz-a] mode:", dryRun ? "DRY-RUN" : "APPLY");
console.log("[faz-a] diskten SILINMEZ — yalnizca git index (--cached)");

let total = 0;
for (const dir of DIR_UNTRACK) {
  const n = countTracked(dir);
  console.log(`[faz-a] dir ${dir}: ${n} tracked`);
  total += n;
  if (!n || dryRun) continue;
  const r = git(["rm", "-r", "--cached", "--", dir]);
  if (r === null) process.exit(1);
  console.log(`[faz-a] untracked dir OK: ${dir}`);
}

for (const f of FILE_UNTRACK) {
  const n = countTracked(f);
  if (!n) continue;
  console.log(`[faz-a] file ${f}`);
  total += n;
  if (dryRun) continue;
  const r = git(["rm", "--cached", "--", f]);
  if (r === null) process.exit(1);
}

console.log("[faz-a] toplam git-tracked hedef:", total);
if (dryRun) console.log("[faz-a] Uygulamak icin: node scripts/faz-a-safe-repo-cleanup.mjs");
