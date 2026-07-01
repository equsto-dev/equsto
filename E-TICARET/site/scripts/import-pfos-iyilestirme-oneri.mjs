/**
 * iyileştirme.md → PfosSkuLinkOneri + PfosFiyatKurali
 *
 * npm run pfos:iyilestirme:import -- \
 *   --file PFOS/veri/proje-veri/iyileştirme.md \
 *   --liste-key s13-388-turk-220 \
 *   --teklif EQS-2026-650 \
 *   --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importIyilestirmeMarkdown } from "../lib/pfos/import-iyilestirme.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

const fileArg = arg("--file");
const listeKey = arg("--liste-key");
const teklif = arg("--teklif");
const dryRun = process.argv.includes("--dry-run");

if (!listeKey) {
  console.error(
    "Kullanım: npm run pfos:iyilestirme:import -- --liste-key <key> [--file path] [--teklif no] [--dry-run]",
  );
  process.exit(1);
}

const defaultFile = path.join(SITE, "PFOS/veri/proje-veri/iyileştirme.md");
const repoFile = path.join(SITE, "../../PFOS/veri/proje-veri/iyileştirme.md");
const filePath = fileArg
  ? path.resolve(process.cwd(), fileArg)
  : fs.existsSync(defaultFile)
    ? defaultFile
    : repoFile;

if (!fs.existsSync(filePath)) {
  console.error(`Dosya bulunamadı: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf8");
const result = await importIyilestirmeMarkdown({
  content,
  listeKey,
  teklifSayi: teklif,
  dryRun,
});

console.log(
  `[pfos:iyilestirme:import]${dryRun ? " (dry-run)" : ""} dosya=${filePath}`,
);
console.log(`  listeKey=${listeKey} teklif=${teklif ?? "—"}`);
console.log(`  parsed=${result.parsed}`);
console.log(
  `  sku_oneri: +${result.skuOneriCreated} skip=${result.skuOneriSkipped}`,
);
console.log(
  `  fiyat_kurali: +${result.fiyatKuraliCreated} skip=${result.fiyatKuraliSkipped}`,
);

for (const e of result.entries) {
  console.log(`  · ${e.poz} ${e.sorunTipi} → ${e.action}${e.reason ? ` (${e.reason})` : ""}`);
}
