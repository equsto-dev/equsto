/**
 * equsto-v2/public/data → ../public/data (dept + ekipmanlar).
 *   node scripts/sync-atalay-catalog-to-legacy-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/data");
const DEST = path.join(ROOT, "..", "public/data");

function copyFile(rel) {
  const from = path.join(SRC, rel);
  const to = path.join(DEST, rel);
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log("[sync-legacy-data]", rel);
}

fs.mkdirSync(DEST, { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, "dept"))) {
  if (f.endsWith(".json")) copyFile(path.join("dept", f));
}
copyFile("ekipmanlar.json");
