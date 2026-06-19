import { loadLegacyCatalogRows } from "../lib/legacy-catalog";
import { isPisirmeReferans, matchPisirmeByReferans } from "../lib/pfos/referans/pisirme-match";
import { isOztiPisirmeRow, isOztiKatalogMarka } from "../lib/pfos/core/ozti-marka";

async function main() {
  const rows = await loadLegacyCatalogRows();
  const targetSku = "8890.P5050.01";
  const row = rows.find(r => r.sku === targetSku);
  if (!row) {
    console.error(`Row ${targetSku} not found!`);
    return;
  }

  console.log("Found row:", row.sku, row.ad, "Brand:", row.marka_ad, "Category:", row.kategori);

  const isim = "PİZZA FIRINI, TEK KATLI, ELK.";
  
  // Let's test the conditions in scoreOztiPisirmeRow:
  console.log("isOztiPisirmeRow:", isOztiPisirmeRow(row));
  console.log("isOztiKatalogMarka:", isOztiKatalogMarka(row.marka_ad));
  
  // Let's call matchPisirmeByReferans and see what it does
  const res = await matchPisirmeByReferans(isim, "", "", "pide-pizza-firin", "orta");
  console.log("Match Result for", isim, "is:", res?.id, "with SKU:", res?.sku, "and Price:", res?.fiyat);
}

main().catch(console.error);
