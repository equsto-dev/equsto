/**
 * Tamamlayıcı ürün rol skorlaması — inline.js ile aynı mantık (doğrulama).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const all = JSON.parse(fs.readFileSync(path.join(siteDir, "public/data/ekipmanlar.json"), "utf8"));
const inline = fs.readFileSync(path.join(siteDir, "public/eq-product-page-inline.js"), "utf8");

import vm from "node:vm";

const fnBlock = inline.slice(
  inline.indexOf("var COMPLEMENT_CATEGORY_SLUGS = {"),
  inline.indexOf("function pdpThumbSrcUrl(p)"),
);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fnBlock, ctx);

const {
  detectProductRole,
  inferRoleFromCategory,
  scoreComplementCandidate,
  diversifyRoleComplements,
} = ctx;

function topFor(x, n = 10) {
  const curRole = detectProductRole(x) || inferRoleFromCategory(x);
  const scored = all
    .filter((p) => p !== x)
    .map((p) => ({ p, s: scoreComplementCandidate(p, x, curRole) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || String(a.p.name).localeCompare(String(b.p.name), "tr"));
  const items = diversifyRoleComplements(scored, curRole, n);
  return { curRole, scored: items.map((p) => ({ p, s: scoreComplementCandidate(p, x, curRole) })) };
}

const fryer = all.find((p) => /391095|2x18Lt Frit/i.test(p.name || "") && /electrolux/i.test(p.brand || ""));
const kiyma = all.find((p) => p.category === "et-kiyma-makineleri" && /KIYMA MK 12/i.test(p.name || ""));

function print(label, x) {
  console.log(`\n=== ${label} === role=${topFor(x).curRole}`);
  console.log(`Ürün: ${x?.name?.slice(0, 70)}`);
  for (const r of topFor(x).scored) {
    console.log(`${r.s} | ${r.p.category} | ${r.p.name?.slice(0, 65)}`);
  }
}

print("FRITOZ", fryer);
print("KIYMA", kiyma);

const kiyTop = topFor(kiyma, 24).scored;
const kiyRoles = new Set(
  kiyTop.map((r) => detectProductRole(r.p) || inferRoleFromCategory(r.p)),
);
console.log("Kiyma top-24 roles:", [...kiyRoles].join(", "));

const fryBad = topFor(fryer).scored.some((r) => /atalay.*ocak|döner kalıp|adk-/i.test(r.p.name || ""));
const kiyGood =
  kiyRoles.has("dilimleme") &&
  kiyRoles.has("kemik-testere") &&
  kiyRoles.has("hamur-yogurma");

if (fryBad) {
  console.error("FAIL: irrelevant item in fryer strip");
  process.exit(1);
}
if (!kiyGood) {
  console.error("FAIL: kiyma strip missing kemik/hamur/gida dilimleme");
  process.exit(1);
}
console.log("\nOK — complementary roles");
