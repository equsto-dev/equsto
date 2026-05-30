/**
 * Faz B — AWS S3 sync (önerilen, ~20 GB kapasite).
 * Diskten SILMEZ; aws s3 sync ile public/ → S3.
 *
 *   node scripts/faz-b-upload-s3.mjs --dry-run
 *   node scripts/faz-b-upload-s3.mjs --sync
 *
 * .env.local:
 *   AWS_S3_BUCKET=equsto-assets
 *   AWS_REGION=eu-central-1
 *   AWS_PROFILE=equsto          (opsiyonel)
 *   NEXT_PUBLIC_ASSET_CDN_URL=  (CloudFront — sync sonrası Vercel'e)
 */
import "./load-env.mjs";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cdnSyncDirs,
  listCdnMigrateFiles,
} from "./lib/cdn-migrate-paths.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(siteDir, "public");
const manifestPath = path.join(siteDir, "docs", "s3-upload-manifest.json");

const dryRun = process.argv.includes("--dry-run");
const doSync = process.argv.includes("--sync");
const bucket = process.env.AWS_S3_BUCKET?.trim();
const region = process.env.AWS_REGION?.trim() || "eu-central-1";
const profile = process.env.AWS_PROFILE?.trim();

function resolveAwsBin() {
  if (process.platform === "win32") {
    const win = "C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe";
    if (fs.existsSync(win)) return win;
  }
  return "aws";
}

const AWS_BIN = resolveAwsBin();

function awsArgs(subcmd, localDir, s3Uri) {
  const args = ["s3", subcmd, localDir, s3Uri, "--region", region];
  if (dryRun) args.push("--dryrun");
  args.push("--only-show-errors");
  if (profile) args.push("--profile", profile);
  return args;
}

function runAws(args) {
  const r = spawnSync(AWS_BIN, args, {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "aws cli failed");
    return false;
  }
  if (r.stdout?.trim()) console.log(r.stdout.trim());
  return true;
}

function awsVersion() {
  const r = spawnSync(AWS_BIN, ["--version"], {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  return r.status === 0 ? (r.stdout || r.stderr || "").trim() : null;
}

const files = listCdnMigrateFiles(publicDir);
const totalMb = +(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1);
const dirs = cdnSyncDirs(publicDir);

console.log("[faz-b-s3] public:", publicDir);
console.log("[faz-b-s3] CDN aday:", files.length, "dosya,", totalMb, "MB (~", (totalMb / 1024).toFixed(1), "GB)");
console.log("[faz-b-s3] sync klasör:", dirs.map((d) => d.prefix).join(", "));

if (!dryRun && !doSync) {
  console.log("\nKullanım:");
  console.log("  node scripts/faz-b-upload-s3.mjs --dry-run");
  console.log("  node scripts/faz-b-upload-s3.mjs --sync");
  console.log("\nGerekli env: AWS_S3_BUCKET, AWS_REGION (varsayılan eu-central-1)");
  process.exit(0);
}

if (!awsVersion()) {
  console.error("[faz-b-s3] AWS CLI yok — https://aws.amazon.com/cli/");
  process.exit(1);
}
console.log("[faz-b-s3]", awsVersion());

if (!bucket) {
  console.error("[faz-b-s3] AWS_S3_BUCKET tanımlı değil (.env.local)");
  process.exit(1);
}

console.log("[faz-b-s3] bucket: s3://" + bucket);
console.log("[faz-b-s3] region:", region);
console.log("[faz-b-s3] mod:", dryRun ? "DRY-RUN" : "SYNC");

const results = [];
for (const d of dirs) {
  const s3Uri = `s3://${bucket}/${d.s3Key}`;
  console.log("\n[faz-b-s3]", dryRun ? "dry-run" : "sync", d.local, "→", s3Uri);
  const ok = runAws(awsArgs("sync", d.local, s3Uri));
  results.push({ prefix: d.prefix, s3Uri, ok });
  if (!ok) process.exit(1);
}

const manifest = {
  updatedAt: new Date().toISOString(),
  bucket,
  region,
  totalFiles: files.length,
  totalMb,
  dirs: results,
  cdnEnvHint:
    process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim() ||
    process.env.AWS_CLOUDFRONT_URL?.trim() ||
    "(CloudFront URL → NEXT_PUBLIC_ASSET_CDN_URL)",
};
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("\n[faz-b-s3] manifest:", manifestPath);
console.log("[faz-b-s3] Vercel env:");
console.log("  NEXT_PUBLIC_ASSET_CDN_URL=" + manifest.cdnEnvHint);
if (dryRun) {
  console.log("[faz-b-s3] dry-run bitti — gerçek yükleme: --sync");
}
