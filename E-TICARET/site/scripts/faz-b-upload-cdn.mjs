/**
 * Faz B — CDN yükleme (Vercel Blob).
 * Diskten SILMEZ; yalnızca object storage'a kopyalar + manifest yazar.
 *
 *   node scripts/faz-b-upload-cdn.mjs --dry-run
 *   node scripts/faz-b-upload-cdn.mjs --upload --limit 10
 *
 * Gerekli: BLOB_READ_WRITE_TOKEN (+ npm i @vercel/blob)
 */
import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(siteDir, "public");
const manifestPath = path.join(siteDir, "docs", "cdn-upload-manifest.json");

const CDN_PREFIXES = [
  "images/",
  "data/caglayan-market/",
  "data/prosogutma-market/",
  "data/vitrum-drawings/",
  "data/advanced-cuisine-clear-ice/images/",
  "data/electrolux-professional/",
];

const dryRun = process.argv.includes("--dry-run");
const doUpload = process.argv.includes("--upload");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 0;

function walkPublic(dir, base = publicDir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPublic(p, base, out);
    else {
      const rel = path.relative(base, p).replace(/\\/g, "/");
      const bytes = fs.statSync(p).size;
      out.push({ rel, bytes, abs: p });
    }
  }
  return out;
}

function isCdnMigrate(rel, bytes) {
  if (rel.startsWith("images/")) return true;
  for (const prefix of CDN_PREFIXES) {
    if (prefix === "images/") continue;
    if (rel.startsWith(prefix)) return true;
  }
  if (rel.startsWith("data/") && (rel.endsWith(".pdf") || bytes > 1048576)) return true;
  return bytes > 5 * 1048576;
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return { uploaded: {} };
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function saveManifest(manifest) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

const all = walkPublic(publicDir).filter((f) => isCdnMigrate(f.rel, f.bytes));
const totalMb = +(all.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(1);

console.log("[faz-b] public kök:", publicDir);
console.log("[faz-b] CDN aday:", all.length, "dosya,", totalMb, "MB");

if (dryRun || !doUpload) {
  console.log("[faz-b] mod:", dryRun ? "DRY-RUN" : "LIST ( --upload ile yükle )");
  for (const f of all.slice(0, 30)) {
    console.log(" ", f.rel, `(${(f.bytes / 1048576).toFixed(2)} MB)`);
  }
  if (all.length > 30) console.log(`  … +${all.length - 30} dosya daha`);
  if (!doUpload) process.exit(0);
}

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("[faz-b] BLOB_READ_WRITE_TOKEN yok — Vercel Dashboard → Storage → Blob");
  process.exit(1);
}

let put;
try {
  ({ put } = await import("@vercel/blob"));
} catch {
  console.error("[faz-b] @vercel/blob yüklü değil: npm i -D @vercel/blob");
  process.exit(1);
}

const manifest = loadManifest();
const batch = limit > 0 ? all.filter((f) => !manifest.uploaded[f.rel]).slice(0, limit) : all.filter((f) => !manifest.uploaded[f.rel]);

console.log("[faz-b] yüklenecek:", batch.length, "dosya (atlanan manifest:", all.length - batch.length, ")");

let ok = 0;
let fail = 0;
for (const f of batch) {
  try {
    const body = fs.readFileSync(f.abs);
    const blob = await put(f.rel, body, {
      access: "public",
      token,
      addRandomSuffix: false,
    });
    manifest.uploaded[f.rel] = {
      url: blob.url,
      bytes: f.bytes,
      at: new Date().toISOString(),
    };
    ok++;
    if (ok % 50 === 0) {
      saveManifest(manifest);
      console.log("[faz-b]", ok, "/", batch.length);
    }
  } catch (err) {
    fail++;
    console.error("[faz-b] HATA", f.rel, err?.message || err);
    if (fail > 5) break;
  }
}

manifest.summary = {
  totalCandidates: all.length,
  totalMb,
  uploadedCount: Object.keys(manifest.uploaded).length,
  updatedAt: new Date().toISOString(),
};
saveManifest(manifest);
console.log("[faz-b] bitti — ok:", ok, "fail:", fail);
console.log("[faz-b] manifest:", manifestPath);
if (ok > 0) {
  const sample = Object.values(manifest.uploaded)[0];
  const base = sample?.url ? String(sample.url).replace(/\/[^/]+$/, "") : "";
  if (base) console.log("[faz-b] NEXT_PUBLIC_ASSET_CDN_URL önerisi:", base);
}
