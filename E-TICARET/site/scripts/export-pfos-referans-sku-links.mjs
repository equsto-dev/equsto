/**
 * DB onaylı PfosReferansSkuLink → public/data/pfos-referans-sku-links.json
 * Kullanım: node --import ./scripts/load-env.mjs scripts/export-pfos-referans-sku-links.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const OUT = path.join(SITE, "public", "data", "pfos-referans-sku-links.json");

async function main() {
  const { listReferansSkuLinks } = await import(
    "../lib/pfos/referans/sku-link-db.ts"
  );

  let existing = { version: 1, note: "", links: {} };
  if (fs.existsSync(OUT)) {
    existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
  }

  const rows = await listReferansSkuLinks(5000);
  const links = { ...(existing.links ?? {}) };

  for (const row of rows) {
    const entry = { sku: row.sku };
    if (row.name) entry.name = row.name;
    if (row.marka) entry.marka = row.marka;
    links[row.linkKey] = entry;
  }

  const out = {
    version: typeof existing.version === "number" ? existing.version : 1,
    note:
      existing.note ||
      "Doğrulanmış referans poz → katalog SKU. Anahtar: {listeKey}|{poz}. DB export ile güncellenir.",
    exportedAt: new Date().toISOString(),
    dbLinkCount: rows.length,
    links,
  };

  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `[pfos:referans-sku-links:export] ${rows.length} DB link → ${Object.keys(links).length} toplam anahtar`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
