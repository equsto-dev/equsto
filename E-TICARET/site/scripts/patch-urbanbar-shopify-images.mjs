#!/usr/bin/env node
/**
 * Urban Bar dept satırlarına shopify_image ekle (CDN 403 yedek).
 *   node scripts/patch-urbanbar-shopify-images.mjs
 *   node scripts/patch-urbanbar-shopify-images.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "scripts/data/urbanbar/urbanbar-web-catalog.json");
const DEPTS = ["icecek", "servis"];
const write = process.argv.includes("--write");

const web = JSON.parse(fs.readFileSync(WEB, "utf8"));
const byHandle = new Map();
for (const p of web.products || []) {
  const url = p.images?.[0];
  if (p.handle && url) byHandle.set(p.handle, url);
}

let patched = 0;
for (const dept of DEPTS) {
  const file = path.join(ROOT, "public/data/dept", `${dept}.json`);
  if (!fs.existsSync(file)) continue;
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    if (!/urban\s*bar/i.test(String(row.brand || ""))) continue;
    const handle = String(row.urbanbar_handle || "").trim();
    const url = handle ? byHandle.get(handle) : null;
    if (!url) continue;
    if (row.shopify_image === url) continue;
    row.shopify_image = url;
    patched++;
  }
  if (write) {
    fs.writeFileSync(file, JSON.stringify(rows) + "\n", "utf8");
    console.log(`[patch] yazildi: ${dept}.json`);
  }
}

console.log(`[patch] shopify_image ${patched} satir${write ? " (kaydedildi)" : " (dry-run, --write ile kaydet)"}`);
