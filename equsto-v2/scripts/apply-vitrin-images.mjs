/**
 * homepage-vitrin.json içindeki /data/images/ yollarını vitrin-image-map + katalog ile günceller.
 *
 *   node scripts/build-vitrin-image-map.mjs
 *   node scripts/apply-vitrin-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const VITRIN = path.join(ROOT, "public/data/homepage-vitrin.json");
const MAP = path.join(ROOT, "public/data/vitrin-image-map.json");

function walk(obj, map, stats) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((x) => walk(x, map, stats));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      (k === "image" || k === "thumb" || k === "headerImage") &&
      typeof v === "string" &&
      /^\/data\/images\//i.test(v.trim())
    ) {
      const next = map[v.trim()];
      if (next) {
        out[k] = next;
        stats.fixed++;
      } else {
        out[k] = "";
        stats.cleared++;
      }
    } else {
      out[k] = walk(v, map, stats);
    }
  }
  return out;
}

const map = JSON.parse(fs.readFileSync(MAP, "utf8"));
const vitrin = JSON.parse(fs.readFileSync(VITRIN, "utf8"));
const stats = { fixed: 0, cleared: 0 };
const next = walk(vitrin, map, stats);
fs.writeFileSync(VITRIN, JSON.stringify(next, null, 2), "utf8");
console.log("[apply-vitrin] fixed:", stats.fixed, "cleared (no file):", stats.cleared);
