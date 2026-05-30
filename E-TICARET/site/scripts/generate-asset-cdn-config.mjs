/**
 * eq-asset-cdn-config.js — build/dev öncesi üretilir.
 * NEXT_PUBLIC_ASSET_CDN_URL → window.__EQUSTO_ASSET_CDN (legacy JS)
 */
import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "eq-asset-cdn-config.js");

const cdn = (
  process.env.NEXT_PUBLIC_ASSET_CDN_URL ||
  process.env.ASSET_CDN_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

const body = [
  "/* Otomatik — scripts/generate-asset-cdn-config.mjs */",
  `(function(){window.__EQUSTO_ASSET_CDN=${JSON.stringify(cdn)};})();`,
  "",
].join("\n");

fs.writeFileSync(OUT, body, "utf8");
console.log("[asset-cdn-config] →", OUT);
console.log("[asset-cdn-config] CDN:", cdn || "(yok — yerel /equsto.com yolları)");
