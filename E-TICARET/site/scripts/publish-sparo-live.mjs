#!/usr/bin/env node
/**
 * Sparo → canlı (S3 görseller + Meilisearch)
 *
 *   node scripts/publish-sparo-live.mjs
 *   node scripts/publish-sparo-live.mjs --skip-s3
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipS3 = process.argv.includes("--skip-s3");

function run(label, cmd, args) {
  console.log(`\n[publish-sparo] ${label}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false });
  if (r.status !== 0) {
    console.error(`[publish-sparo] HATA: ${label}`);
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

function syncSparoS3() {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || "eu-central-1";
  const profile = process.env.AWS_PROFILE?.trim();
  const local = path.join(ROOT, "public/images/catalog/sparo");
  if (!fs.existsSync(local)) {
    console.error("[publish-sparo] görseller yok — önce npm run catalog:sparo:full");
    process.exit(1);
  }
  if (!bucket) {
    console.error("[publish-sparo] AWS_S3_BUCKET tanımlı değil");
    process.exit(1);
  }
  const s3Uri = `s3://${bucket}/images/catalog/sparo`;
  const args = ["s3", "sync", local, s3Uri, "--region", region, "--only-show-errors"];
  if (profile) args.push("--profile", profile);
  console.log(`\n[publish-sparo] S3 sync ${local} → ${s3Uri}`);
  const r = spawnSync(resolveAwsBin(), args, { stdio: "inherit", shell: false });
  if (r.status !== 0) process.exit(r.status || 1);
}

run("Sparo import", process.execPath, ["scripts/import-sparo-to-equsto.mjs"]);
if (!skipS3) syncSparoS3();
run("Meilisearch indeks", process.execPath, [
  "--import",
  "./scripts/load-env.mjs",
  "scripts/index-meilisearch.mjs",
]);

console.log("\n[publish-sparo] OK");
console.log("  /shop/pisirme?tip=komurlu-izgara");
console.log("  /shop/marka/sparo");
