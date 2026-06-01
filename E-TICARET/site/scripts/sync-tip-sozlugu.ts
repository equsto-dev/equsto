/**
 * Tip sözlüğünü katalog + PFOS motor anahtarlarından yeniler.
 *   npx tsx scripts/sync-tip-sozlugu.ts
 */
import { rebuildTipSozlugu } from "../lib/tip-sozlugu/rebuild";
import { saveTipSozluguEntries } from "../lib/tip-sozlugu/store";

async function main() {
  const { entries, stats } = await rebuildTipSozlugu();
  const file = await saveTipSozluguEntries(entries);
  const withFreq = entries.filter((e) => e.frekans > 0).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        count: entries.length,
        katalogda_eslesen: withFreq,
        updated: file.updated,
        stats,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
