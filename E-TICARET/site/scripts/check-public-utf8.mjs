/**
 * Deploy öncesi: kritik public HTML/JSON dosyalarında U+FFFD yasak.
 *   node scripts/check-public-utf8.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const MUST_BE_CLEAN = [
  "data/footer-vitrin.json",
  "i18n/tr.json",
  "i18n/en.json",
];

const PFOS_REF_DIR = path.join(PUBLIC, "data/pfos-referans");

let failed = false;

for (const rel of MUST_BE_CLEAN) {
  const p = path.join(PUBLIC, rel);
  if (!fs.existsSync(p)) {
    console.error("[check-public-utf8] MISSING", rel);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  const fffd = (text.match(/\uFFFD/g) || []).length;
  if (fffd > 0) {
    console.error("[check-public-utf8] FAIL", rel, "U+FFFD count:", fffd);
    failed = true;
  } else {
    console.log("[check-public-utf8] OK", rel);
  }
}

if (fs.existsSync(PFOS_REF_DIR)) {
  for (const ent of fs.readdirSync(PFOS_REF_DIR)) {
    if (!ent.endsWith(".json")) continue;
    const rel = `data/pfos-referans/${ent}`;
    const p = path.join(PUBLIC, rel);
    const text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    const fffd = (text.match(/\uFFFD/g) || []).length;
    if (fffd > 0) {
      console.error("[check-public-utf8] FAIL", rel, "U+FFFD count:", fffd);
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    "\n[check-public-utf8] UTF-8 bozuk — restore-public-utf8 veya repair-pfos-referans-utf8.mjs",
  );
  process.exit(1);
}

console.log("\n[check-public-utf8] all clean");
