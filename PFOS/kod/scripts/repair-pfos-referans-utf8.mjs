/**
 * PFOS referans JSON — U+FFFD onarımı
 *   node scripts/repair-pfos-referans-utf8.mjs
 *   node scripts/repair-pfos-referans-utf8.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countFffd,
  repairObjectFffdDeep,
} from "./lib/repair-turkish-fffd.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const refDir = path.join(siteDir, "public/data/pfos-referans");
const checkOnly = process.argv.includes("--check");

let totalBefore = 0;
let totalAfter = 0;
let filesTouched = 0;

for (const name of fs.readdirSync(refDir)) {
  if (!name.endsWith(".json")) continue;
  const file = path.join(refDir, name);
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const before = countFffd(raw);
  totalBefore += before;

  if (checkOnly) {
    if (before > 0) console.log("[check]", name, "U+FFFD:", before);
    const needsTypo = /,ıap:|konveyı|ün yı|polişretan|garnitır|giriş-ıçıkış/.test(raw);
    if (needsTypo) console.log("[check]", name, "typo patterns (post-FFFD)");
    if (before === 0 && !needsTypo) continue;
    if (before > 0 || needsTypo) continue;
    continue;
  }

  const data = JSON.parse(raw);
  const rawTypo = /,ıap:|konveyı|ün yı|polişretan|garnitır|giriş-ıçıkış|Makina /.test(raw);
  if (before === 0 && !rawTypo) continue;

  const { obj: obj2, fixes: fixes2 } = repairObjectFffdDeep(data);
  const out = JSON.stringify(obj2, null, 2) + "\n";
  const after = countFffd(out);
  totalAfter += after;
  fs.writeFileSync(file, out, "utf8");
  filesTouched++;
  console.log(
    "[repair]",
    name,
    "before:",
    before,
    "after:",
    after,
    "fixes:",
    fixes2,
  );
}

if (checkOnly) {
  console.log("\n[check] total U+FFFD:", totalBefore);
  process.exit(totalBefore > 0 ? 1 : 0);
}

/** typo-only pass için tüm dosyaları tara */
if (process.argv.includes("--typo-only")) {
  for (const name of fs.readdirSync(refDir)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(refDir, name);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const { obj } = repairObjectFffdDeep(data);
    fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
    console.log("[typo]", name);
  }
}

console.log(
  `\n[repair-pfos-referans-utf8] ${filesTouched} file(s), U+FFFD ${totalBefore} → ${totalAfter}`,
);
process.exit(totalAfter > 0 ? 1 : 0);
