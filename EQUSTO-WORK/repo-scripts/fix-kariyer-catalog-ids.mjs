/**
 * kari-yermutfak__* id → catalogId; eski slug → yeni slug yönlendirmeleri.
 *
 *   node scripts/fix-kariyer-catalog-ids.mjs
 *   node scripts/fix-kariyer-catalog-ids.mjs --dry-run
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalogId } from "./lib/catalog-classify.mjs";
import { productSlug, productPath } from "./eq-seo-lib.mjs";
import { ROOT, REDIRECTS_PATH } from "./lib/competitor-url-resolve.mjs";

const DRY = process.argv.includes("--dry-run");
const CATALOG = join(ROOT, "public", "data", "ekipmanlar.json");

function oldSlugFromKariId(id, dept) {
  const tail = String(id).replace(/^kari-yermutfak__/i, "");
  const slug = "kari-yermutfak-" + tail.replace(/__/g, "-");
  return productPath(dept, slug);
}

function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
  const redirects = [];
  let idChanges = 0;

  for (const p of catalog) {
    if (!/^kari-yermutfak__/i.test(String(p.id || ""))) continue;
    const dept = p.dept || "pisirme";
    const fromPath = oldSlugFromKariId(p.id, dept);
    const newSlug = productSlug(p.brand, p.name);
    const toPath = productPath(dept, newSlug);
    const newId = catalogId(p);

    if (fromPath !== toPath) {
      redirects.push({ from: fromPath, to: toPath, id: p.id });
    }
    if (newId !== p.id) {
      console.log("id:", p.id, "→", newId);
      if (!DRY) p.id = newId;
      idChanges++;
    }
  }

  if (!DRY) {
    writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
    writeFileSync(
      REDIRECTS_PATH,
      JSON.stringify({ version: 1, redirects }, null, 2) + "\n",
      "utf8"
    );
  }

  console.log(DRY ? "[dry-run]" : "[apply]", "id changes:", idChanges, "redirects:", redirects.length);
  for (const r of redirects) console.log(" ", r.from, "→", r.to);
}

main();
