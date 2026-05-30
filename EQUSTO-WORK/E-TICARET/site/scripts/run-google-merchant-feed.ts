/**
 * tsx scripts/run-google-merchant-feed.ts
 * Yerel feed testi / public/feeds/google-products.xml üretimi.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGoogleMerchantFeedXml } from "@/lib/google-merchant-feed";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(siteDir, "public", "feeds", "google-products.xml");

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const statsOnly = process.argv.includes("--stats");

  const { xml, stats, origin } = await buildGoogleMerchantFeedXml({
    limit: Number.isFinite(limit) && limit! > 0 ? limit : undefined,
  });

  console.log(JSON.stringify({ origin, stats }, null, 2));

  if (statsOnly) return;

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, xml, "utf8");
  console.log("Wrote", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
