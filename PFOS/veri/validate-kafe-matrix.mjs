#!/usr/bin/env node
/**
 * Kafe matris rules vs referans seed karşılaştırması
 * node veri/validate-kafe-matrix.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ROOT, "../../E-TICARET/site");

async function main() {
  const buildMod = await import(
    pathToFileURL(path.join(SITE, "lib/pfos/core/rules/kafe/build-template.ts")).href
  );
  const resolverMod = await import(
    pathToFileURL(path.join(SITE, "lib/pfos/core/matrix/kafe-resolver.ts")).href
  );

  const cells = resolverMod.listKafeCells();
  console.log("=== KAFE MATRİS DOĞRULAMA ===\n");

  for (const cell of cells) {
    const m2 = cell.referansM2;
    const rulesTpl = await buildMod.buildKafeMatrixTemplate(m2, {
      olcek: cell.olcek,
      yogunluk: cell.yogunluk,
      preferReferansSeed: false,
    });
    const rulesCount = rulesTpl.items.length;

    let seedCount = "—";
    if (cell.referansSeed) {
      const seedTpl = await buildMod.buildKafeMatrixTemplate(m2, {
        olcek: cell.olcek,
        yogunluk: cell.yogunluk,
        preferReferansSeed: true,
      });
      seedCount = String(seedTpl.items.length);
    }

    console.log(
      `${cell.id.padEnd(28)} rules=${String(rulesCount).padStart(2)}  seed=${seedCount.padStart(3)}  ${cell.interpolated ? "(interp.)" : ""}`,
    );
  }

  const out = path.join(ROOT, "kafe-matrix-dogrulama.txt");
  console.log(`\nMatris: ${path.join(SITE, "lib/pfos/core/matrix/kafe.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
