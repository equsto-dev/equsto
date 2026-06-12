#!/usr/bin/env node
/**
 * Urban Bar → canlı (Besos katalog + S3 görseller + Meilisearch)
 *
 *   node scripts/publish-urbanbar-live.mjs
 *   node scripts/publish-urbanbar-live.mjs --skip-s3
 *   node scripts/publish-urbanbar-live.mjs --skip-search
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipS3 = process.argv.includes("--skip-s3");
const skipSearch = process.argv.includes("--skip-search");

function run(label, cmd, args, opts = {}) {
  console.log(`\n[publish-urbanbar] ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (r.status !== 0) {
    console.error(`[publish-urbanbar] HATA: ${label}`);
    process.exit(r.status || 1);
  }
}

function resolveAwsBin() {
  if (process.platform === "win32") {
    const win = "C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe";
    if (fs.existsSync(win)) return win;
  }
  return "aws";
}

function syncUrbanbarS3() {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || "eu-central-1";
  const profile = process.env.AWS_PROFILE?.trim();
  const local = path.join(ROOT, "public/images/catalog/urbanbar");
  if (!fs.existsSync(local)) {
    console.error("[publish-urbanbar] urbanbar görselleri yok — önce catalog:urbanbar:full");
    process.exit(1);
  }
  if (!bucket) {
    console.error("[publish-urbanbar] AWS_S3_BUCKET tanımlı değil (.env.local)");
    process.exit(1);
  }
  const s3Uri = `s3://${bucket}/images/catalog/urbanbar`;
  const args = ["s3", "sync", local, s3Uri, "--region", region, "--only-show-errors"];
  if (profile) args.push("--profile", profile);
  console.log(`\n[publish-urbanbar] S3 sync ${local} → ${s3Uri}`);
  const r = spawnSync(resolveAwsBin(), args, { stdio: "inherit", shell: false });
  if (r.status !== 0) process.exit(r.status || 1);
}

run("Besos katalog JSON", process.execPath, ["scripts/build-urbanbar-besos-catalog.mjs"]);

if (!skipS3) syncUrbanbarS3();
else console.log("\n[publish-urbanbar] S3 atlandı (--skip-s3)");

if (!skipSearch) {
  run("Meilisearch indeks", process.execPath, ["--import", "./scripts/load-env.mjs", "scripts/index-meilisearch.mjs"]);
} else {
  console.log("\n[publish-urbanbar] search:index atlandı (--skip-search)");
}

console.log("\n[publish-urbanbar] OK");
console.log("  /besos/bardaklar");
console.log("  /besos/bar-ekipman");
console.log("  git push → Vercel/Hetzner deploy");
