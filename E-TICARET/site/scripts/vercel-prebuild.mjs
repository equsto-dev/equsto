/**
 * Vercel build öncesi — Prisma + tsconfig (Turbopack uyumlu).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findRepoRoot } from "./vercel-resolve-site.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Eski symlink/cache: .next repo kokunde araniyorsa ENOENT onlenir */
function cleanStaleNextDirs(dir) {
  const repo = findRepoRoot(dir);
  for (const target of [path.join(dir, ".next"), path.join(repo, ".next")]) {
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    console.log("[vercel-prebuild] eski .next silindi:", target);
  }
}

function patchPrismaSchemaForVercel(dir) {
  const schemaPath = path.join(dir, "prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) return;
  const text = fs.readFileSync(schemaPath, "utf8");
  const next = text.replace(/^\s*output\s*=\s*["'][^"']+["']\s*\r?\n/gm, "");
  if (next !== text) {
    fs.writeFileSync(schemaPath, next);
    console.log("[vercel-prebuild] Prisma schema → @prisma/client");
  }
  const genDir = path.join(dir, "prisma", "generated");
  if (fs.existsSync(genDir)) fs.rmSync(genDir, { recursive: true, force: true });
}

function patchPrismaLibForVercel(dir) {
  fs.writeFileSync(
    path.join(dir, "lib/prisma.ts"),
    'export { PrismaClient, Prisma } from "@prisma/client";\nexport type * from "@prisma/client";\n'
  );
}

function patchTsconfigForVercel(dir) {
  const tsPath = path.join(dir, "tsconfig.json");
  if (!fs.existsSync(tsPath)) return;
  let text = fs.readFileSync(tsPath, "utf8");
  const next = text.replace(/,?\s*"@prisma\/client":\s*\["\.\/prisma\/generated\/client"\]/, "");
  if (next !== text) fs.writeFileSync(tsPath, next);
}

/** Yerel: imports → prisma/generated; Vercel: node_modules/.prisma/client */
function patchPackageJsonForVercel(dir) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.imports?.["@prisma/client"]?.includes("prisma/generated")) return;
  delete pkg.imports;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("[vercel-prebuild] package.json imports kaldırıldı → @prisma/client");
}

/** PFOS build-time JSON → public/data (runtime fs okuma + statik yedek) */
function syncPfosDataToPublic(dir) {
  const srcDir = path.join(dir, "lib/pfos/data");
  const destDir = path.join(dir, "public/data");
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith(".json")) continue;
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    fs.copyFileSync(src, dest);
  }
  console.log("[vercel-prebuild] lib/pfos/data → public/data");
}

cleanStaleNextDirs(siteDir);
patchPrismaSchemaForVercel(siteDir);
patchPrismaLibForVercel(siteDir);
patchTsconfigForVercel(siteDir);
patchPackageJsonForVercel(siteDir);
syncPfosDataToPublic(siteDir);

function syncGeoLandingsToLib(dir) {
  const src = path.join(dir, "public/data/geo-landings.json");
  const destDir = path.join(dir, "lib/geo");
  const dest = path.join(destDir, "landings.json");
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("[vercel-prebuild] geo-landings → lib/geo/landings.json");
}

syncGeoLandingsToLib(siteDir);

const buildI18nEn = path.join(siteDir, "scripts/build-i18n-en.mjs");
if (fs.existsSync(buildI18nEn)) {
  const r = spawnSync(process.execPath, [buildI18nEn], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const buildPfosLabels = path.join(siteDir, "scripts/build-pfos-labels-en.mjs");
if (fs.existsSync(buildPfosLabels)) {
  const r = spawnSync(process.execPath, [buildPfosLabels], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const buildProductI18n = path.join(siteDir, "scripts/build-product-i18n-en.mjs");
if (fs.existsSync(buildProductI18n)) {
  const r = spawnSync(process.execPath, [buildProductI18n], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const buildEn = path.join(siteDir, "scripts/build-geo-landings-en.mjs");
if (fs.existsSync(buildEn)) {
  const r = spawnSync(process.execPath, [buildEn], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function syncGeoLandingsEnToLib(dir) {
  const src = path.join(dir, "public/data/geo-landings-en.json");
  const dest = path.join(dir, "lib/geo/landings-en.json");
  if (!fs.existsSync(src)) {
    console.error(
      "[vercel-prebuild] HATA: public/data/geo-landings-en.json yok — commit edin veya build-geo-landings-en.mjs çalıştırın"
    );
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("[vercel-prebuild] geo-landings-en → lib/geo/landings-en.json");
}

syncGeoLandingsEnToLib(siteDir);

const restoreUtf8 = path.join(siteDir, "scripts/restore-public-utf8.mjs");
if (fs.existsSync(restoreUtf8)) {
  const r = spawnSync(process.execPath, [restoreUtf8], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
  const patchHdr = path.join(siteDir, "scripts/patch-header-utf8.mjs");
  if (fs.existsSync(patchHdr)) {
    const r2 = spawnSync(process.execPath, [patchHdr], { cwd: siteDir, stdio: "inherit" });
    if (r2.status !== 0) process.exit(r2.status ?? 1);
  }
}

const checkUtf8 = path.join(siteDir, "scripts/check-public-utf8.mjs");
if (fs.existsSync(checkUtf8)) {
  const r = spawnSync(process.execPath, [checkUtf8], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyPdp = path.join(siteDir, "scripts/verify-pdp-kilit.mjs");
if (fs.existsSync(verifyPdp)) {
  const r = spawnSync(process.execPath, [verifyPdp], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyPdpBuybox = path.join(siteDir, "scripts/verify-pdp-buybox-kilit.mjs");
if (fs.existsSync(verifyPdpBuybox)) {
  const r = spawnSync(process.execPath, [verifyPdpBuybox], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyProdCardAmbient = path.join(siteDir, "scripts/verify-prod-card-ambient-kilit.mjs");
if (fs.existsSync(verifyProdCardAmbient)) {
  const r = spawnSync(process.execPath, [verifyProdCardAmbient], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyBuzdolapNav = path.join(siteDir, "scripts/verify-buzdolap-nav-kilit.mjs");
if (fs.existsSync(verifyBuzdolapNav)) {
  const r = spawnSync(process.execPath, [verifyBuzdolapNav], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyArama = path.join(siteDir, "scripts/verify-arama-kilit.mjs");
if (fs.existsSync(verifyArama)) {
  const r = spawnSync(process.execPath, [verifyArama], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyHomeVitrin = path.join(siteDir, "scripts/verify-home-vitrin-kilit.mjs");
if (fs.existsSync(verifyHomeVitrin)) {
  const r = spawnSync(process.execPath, [verifyHomeVitrin], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyWaCatFab = path.join(siteDir, "scripts/verify-whatsapp-cat-fab-kilit.mjs");
if (fs.existsSync(verifyWaCatFab)) {
  const r = spawnSync(process.execPath, [verifyWaCatFab], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyWaModalChat = path.join(siteDir, "scripts/verify-whatsapp-modal-chat-kilit.mjs");
if (fs.existsSync(verifyWaModalChat)) {
  const r = spawnSync(process.execPath, [verifyWaModalChat], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyPfosUyeAuth = path.join(siteDir, "scripts/verify-pfos-uye-auth-kilit.mjs");
if (fs.existsSync(verifyPfosUyeAuth)) {
  const r = spawnSync(process.execPath, [verifyPfosUyeAuth], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyPfosListeUploadRail = path.join(
  siteDir,
  "scripts/verify-pfos-liste-upload-rail-kilit.mjs",
);
if (fs.existsSync(verifyPfosListeUploadRail)) {
  const r = spawnSync(process.execPath, [verifyPfosListeUploadRail], {
    cwd: siteDir,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyInoksanIstif = path.join(siteDir, "scripts/verify-inoksan-istif-images-kilit.mjs");
if (fs.existsSync(verifyInoksanIstif)) {
  const r = spawnSync(process.execPath, [verifyInoksanIstif], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyBesosUrbanBarImages = path.join(siteDir, "scripts/verify-besos-urbanbar-images-kilit.mjs");
if (fs.existsSync(verifyBesosUrbanBarImages)) {
  const r = spawnSync(process.execPath, [verifyBesosUrbanBarImages], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const buildSitemap = path.join(siteDir, "scripts/build-sitemap.mjs");
if (fs.existsSync(buildSitemap)) {
  const r = spawnSync(process.execPath, [buildSitemap], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const dbUrl = process.env.DATABASE_URL || "";
if (process.env.VERCEL === "1" && dbUrl && !dbUrl.includes("127.0.0.1:5432/build")) {
  console.log("[vercel-prebuild] prisma db push (şema — ShopCart)");
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const push = spawnSync(npx, ["prisma", "db", "push", "--skip-generate"], {
    cwd: siteDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (push.status !== 0) {
    console.warn("[vercel-prebuild] db push uyarı — ShopCart tabloları manuel oluşturulmalı");
  }
}

const verifyElectrolux = path.join(siteDir, "scripts/verify-electrolux-catalog.mjs");
if (fs.existsSync(verifyElectrolux)) {
  const r = spawnSync(process.execPath, [verifyElectrolux], { cwd: siteDir, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const verifyPublicBudget = path.join(siteDir, "scripts/verify-vercel-public-budget.mjs");
if (fs.existsSync(verifyPublicBudget)) {
  spawnSync(process.execPath, [verifyPublicBudget], { cwd: siteDir, stdio: "inherit" });
}

console.log("[vercel-prebuild] OK");
