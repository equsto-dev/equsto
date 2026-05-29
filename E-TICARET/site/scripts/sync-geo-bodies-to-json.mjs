/**
 * geo-bodies-600.json → lib/geo/landings.json + public/data/geo-landings.json
 * API /api/geo doğrudan body döndürür; eq-geo-landing.js fallback'e güvenilmez.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bodies = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/geo-bodies-600.json"), "utf8")
);

function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function syncFile(rel) {
  const p = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  let n = 0;
  for (const [key, page] of Object.entries(data)) {
    if (key === "version" || key === "source" || !page?.profile) continue;
    const body = bodies[page.profile];
    if (!body) {
      console.warn(`[skip] ${rel} ${key} — no body for profile ${page.profile}`);
      continue;
    }
    page.body = body;
    const len = plainText(body).length;
    if (len < 850) console.warn(`[warn] ${key}: ${len} chars`);
    n++;
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`[sync] ${rel} — ${n} pages`);
}

syncFile("lib/geo/landings.json");
syncFile("public/data/geo-landings.json");

const enBodies = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/geo-bodies-en.json"), "utf8")
);

function syncEnFile(rel) {
  const p = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  let n = 0;
  for (const [key, page] of Object.entries(data)) {
    if (key === "version" || key === "source" || !page?.profile) continue;
    if (key === "en/blog") continue;
    const body = enBodies[page.profile];
    if (!body) continue;
    page.body = body;
    n++;
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`[sync-en] ${rel} — ${n} pages`);
}

syncEnFile("lib/geo/landings-en.json");
syncEnFile("public/data/geo-landings-en.json");
