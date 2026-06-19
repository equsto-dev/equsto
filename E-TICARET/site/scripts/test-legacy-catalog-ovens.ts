import { loadLegacyCatalogRows } from "../lib/legacy-catalog";

async function main() {
  console.log("Loading legacy catalog rows...");
  const rows = await loadLegacyCatalogRows();
  console.log(`Loaded ${rows.length} rows.`);

  const cayRows = rows.filter((r) => r.ad && /cay|çay/i.test(r.ad));
  console.log(`Found ${cayRows.length} cay/çay products in legacy catalog.`);

  cayRows.forEach((r) => {
    console.log(
      `ID: ${r.id.padEnd(20)} | SKU: ${r.sku?.padEnd(20)} | Marka: ${r.marka_ad.padEnd(20)} | Ad: ${r.ad.slice(0, 50).padEnd(50)} | Fiyat: ${r.fiyat_tl} TL`
    );
  });
}

main().catch(console.error);
