/**
 * UTF-8 temiz public/index.html → equsto-v2/public/index.html (Vercel kökü)
 *   node equsto-v2/scripts/sync-index-from-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "public/index.html");
const dest = path.join(root, "equsto-v2/public/index.html");

let html = fs.readFileSync(src, "utf8");

if (html.includes("eq-decor-catstrip")) {
  html = html.replace(
    /\s*<nav class="eq-decor-catstrip"[\s\S]*?<\/nav>\s*\n/,
    "\n"
  );
}

html = html
  .replace("/theme.css?v=20260521globalsearch", "/theme.css?v=20260519topnavstatic")
  .replace("/theme.js?v=20260521globalsearch", "/theme.js?v=20260519topnavstatic")
  .replace("/nav.js?v=20260521globalsearch", "/nav.js?v=20260528setustu")
  .replace("/eq-home-decor.css?v=20260528decor", "/eq-home-decor.css?v=20260519decor");

fs.writeFileSync(dest, html, "utf8");
console.log("[sync-index] OK →", dest);
console.log("[sync-index] catstrip:", html.includes("eq-decor-catstrip"));
console.log("[sync-index] Öne çıkanlar:", html.includes("Öne çıkanlar"));
