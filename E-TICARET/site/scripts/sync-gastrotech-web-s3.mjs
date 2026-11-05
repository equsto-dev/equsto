/**
 * Sadece Gastrotech web görsellerini S3'e sync et.
 *   node --import ./scripts/load-env.mjs scripts/sync-gastrotech-web-s3.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const local = path.join(siteDir, "public/images/catalog/gastrotech/web");
const bucket = process.env.AWS_S3_BUCKET?.trim() || "equsto-assets";
const region = process.env.AWS_REGION?.trim() || "eu-central-1";
const profile = process.env.AWS_PROFILE?.trim();
const aws =
  process.platform === "win32" &&
  fs.existsSync("C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe")
    ? "C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe"
    : "aws";

const s3uri = `s3://${bucket}/images/catalog/gastrotech/web`;
const args = ["s3", "sync", local, s3uri, "--region", region];
if (profile) args.push("--profile", profile);

console.log("[gt-s3]", local, "→", s3uri);
const r = spawnSync(aws, args, { encoding: "utf8", shell: false, windowsHide: true });
if (r.stdout) console.log(r.stdout);
if (r.stderr) console.error(r.stderr);
process.exit(r.status ?? 1);
