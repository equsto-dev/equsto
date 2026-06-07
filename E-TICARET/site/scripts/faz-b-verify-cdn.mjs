/**
 * CDN doğrulama — NEXT_PUBLIC_ASSET_CDN_URL + örnek dosya yolları.
 *   node scripts/faz-b-verify-cdn.mjs
 *   node scripts/faz-b-verify-cdn.mjs --sample=5
 */
import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listCdnMigrateFiles } from "./lib/cdn-migrate-paths.mjs";
import { assetCdnBase } from "./lib/asset-cdn-base.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(siteDir, "public");
const sampleArg = process.argv.find((a) => a.startsWith("--sample="));
const sampleN = sampleArg ? parseInt(sampleArg.split("=")[1], 10) : 8;

const base = assetCdnBase(siteDir);

if (!base) {
  console.error("[verify-cdn] NEXT_PUBLIC_ASSET_CDN_URL boş — .env.local doldurun");
  process.exit(1);
}

function encodeRel(rel) {
  return rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
}

const files = listCdnMigrateFiles(publicDir);
const logoPicks = [
  { rel: "images/equsto-logo.png" },
  { rel: "images/equsto-logo-white.png" },
];
const picks = [
  ...logoPicks,
  ...files.filter((f) => f.rel.startsWith("images/catalog/electrolux/")).slice(0, 2),
  ...files.filter((f) => f.rel.startsWith("images/catalog/ozti/")).slice(0, 2),
  ...files.filter((f) => f.rel.startsWith("images/catalog/")).slice(0, 2),
  ...files.filter((f) => f.rel.endsWith(".pdf")).slice(0, 2),
  ...files.slice(0, 2),
]
  .slice(0, sampleN)
  .filter((f, i, arr) => arr.findIndex((x) => x.rel === f.rel) === i);

console.log("[verify-cdn] base:", base);
console.log("[verify-cdn] örnek:", picks.length, "URL\n");

let ok = 0;
let fail = 0;
for (const f of picks) {
  const url = `${base}/${encodeRel(f.rel)}`;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const status = res.status;
    const mark = status >= 200 && status < 400 ? "OK" : "FAIL";
    if (mark === "OK") ok++;
    else fail++;
    console.log(`${mark} ${status} ${f.rel}`);
    if (mark === "FAIL") console.log("     ", url);
  } catch (e) {
    fail++;
    console.log("FAIL —", f.rel, e?.message || e);
  }
}

console.log("\n[verify-cdn] sonuç:", ok, "OK,", fail, "FAIL");
process.exit(fail > 0 ? 1 : 0);
