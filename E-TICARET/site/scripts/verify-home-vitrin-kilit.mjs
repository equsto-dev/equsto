/**
 * Ana sayfa vitrin kilidi — üst hero + alt slider.
 * Kilit: public/home-vitrin-KILIT.txt
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!fs.existsSync(path.join(siteDir, "public/home-vitrin-KILIT.txt"))) {
  console.error("[verify-home-vitrin-kilit] HATA: home-vitrin-KILIT.txt yok");
  process.exit(1);
}

for (const script of [
  "verify-cdn-asset-urls-kilit.mjs",
  "verify-home-hero-ads-kilit.mjs",
  "verify-home-main-slider-kilit.mjs",
  "verify-home-cafemarkt-hero-kilit.mjs",
  "verify-home-pop-cats-kilit.mjs",
]) {
  const r = spawnSync(process.execPath, [path.join(siteDir, "scripts", script)], {
    cwd: siteDir,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("[verify-home-vitrin-kilit] OK — CDN + hero + slider + cafemarkt hero + pop cats");
