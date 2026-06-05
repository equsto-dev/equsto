/**
 * Faz B sonrası — CDN'e taşınan dosyaları Git index'ten çıkar (diskte KALIR).
 * Yalnızca allowlist prefix; git rm --cached.
 *
 *   node scripts/faz-b-untrack-cdn.mjs --dry-run
 *   node scripts/faz-b-untrack-cdn.mjs
 *
 * Önce CDN'de dosyaların yüklendiğini ve NEXT_PUBLIC_ASSET_CDN_URL'in
 * Vercel'de ayarlandığını doğrulayın.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteDir, "../..");
const publicDir = path.join(siteDir, "public");
const dryRun = process.argv.includes("--dry-run");

const CDN_PREFIXES = [
  "E-TICARET/site/public/images/",
  "E-TICARET/site/public/data/caglayan-market/",
  "E-TICARET/site/public/data/prosogutma-market/",
  "E-TICARET/site/public/data/vitrum-drawings/",
  "E-TICARET/site/public/data/advanced-cuisine-clear-ice/images/",
  "E-TICARET/site/public/data/electrolux-professional/",
];

function git(args, { quiet } = {}) {
  const r = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    if (!quiet) console.error("[faz-b-untrack] git", args.join(" "), "\n", r.stderr || r.stdout);
    return null;
  }
  return (r.stdout || "").trim();
}

function listTracked(prefix) {
  const out = git(["ls-files", "--", prefix], { quiet: true });
  return out ? out.split("\n").filter(Boolean) : [];
}

console.log("[faz-b-untrack] repo:", repoRoot);
console.log("[faz-b-untrack] mode:", dryRun ? "DRY-RUN" : "APPLY");
console.log("[faz-b-untrack] diskten SILINMEZ — yalnizca git index (--cached)");

const tracked = [];
for (const prefix of CDN_PREFIXES) {
  tracked.push(...listTracked(prefix));
}

const unique = [...new Set(tracked)].sort();
console.log("[faz-b-untrack] tracked CDN dosya:", unique.length);

if (!unique.length) {
  console.log("[faz-b-untrack] çıkarılacak tracked dosya yok.");
  process.exit(0);
}

for (const rel of unique.slice(0, 20)) {
  const disk = path.join(repoRoot, rel);
  const exists = fs.existsSync(disk);
  console.log(" ", rel, exists ? "(disk OK)" : "(UYARI: disk yok)");
}
if (unique.length > 20) console.log(`  … +${unique.length - 20} dosya`);

if (dryRun) {
  console.log("[faz-b-untrack] dry-run bitti — uygulamak için --dry-run olmadan çalıştırın.");
  process.exit(0);
}

const chunk = 200;
for (let i = 0; i < unique.length; i += chunk) {
  const slice = unique.slice(i, i + chunk);
  const r = spawnSync("git", ["rm", "--cached", "-r", "--", ...slice], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error("[faz-b-untrack] git rm hata:", r.stderr || r.stdout);
    process.exit(1);
  }
  console.log("[faz-b-untrack] untrack", Math.min(i + chunk, unique.length), "/", unique.length);
}

console.log("[faz-b-untrack] tamam — .gitignore güncellemeyi unutmayın (images/, data/caglayan-market/ vb.)");
