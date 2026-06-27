/**
 * Bulut mutfak referans listeleri → pfos-referans-sku-links.json (motor eşlemesi).
 * Kullanım: node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs scripts/seed-bulut-sku-links.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchReferansKalem } from "../lib/pfos/referans/referans-eslestirme.ts";
import { inferUrunTipiFromReferansSatir } from "../lib/pfos/referans/infer-urun-tipi.ts";
import { clearMatchProductCache } from "../lib/pfos/core/match-product.ts";
import { clearShopCatalogCache } from "../lib/pfos/core/shop-catalog-match.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const REF_DIR = path.join(SITE, "public", "data", "pfos-referans");
const LINKS_PATH = path.join(SITE, "public", "data", "pfos-referans-sku-links.json");

function linkItemFromMatch(urun) {
  if (!urun?.sku) return null;
  const item = {
    sku: urun.sku,
    name: urun.ad ?? urun.isim ?? "",
  };
  if (urun.marka) item.marka = urun.marka;
  if (typeof urun.fiyat_try === "number" && urun.fiyat_try > 0) {
    item.fiyat_try = urun.fiyat_try;
  }
  return item;
}

function listeKeys(kategoriId, bantId) {
  const keys = [`${kategoriId}-${bantId}`, kategoriId];
  if (kategoriId === "bulut-burger") keys.push("bulut-burger-35-100");
  return keys;
}

async function main() {
  const writeLinks = process.argv.includes("--write");
  if (!writeLinks) {
    console.warn(
      "Bulut otomatik SKU seed devre dışı. Yalnızca rapor. Yazmak için --write (önerilmez).",
    );
  }

  clearMatchProductCache();
  clearShopCatalogCache();

  const content = JSON.parse(fs.readFileSync(LINKS_PATH, "utf8"));
  const links = content.links ?? (content.links = {});

  const files = fs
    .readdirSync(REF_DIR)
    .filter((f) => f.startsWith("bulut-") && f.endsWith("-40-80.json"))
    .sort();

  let added = 0;
  let skipped = 0;
  let missed = 0;
  const missLog = [];

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(REF_DIR, file), "utf8"));
    const { kategoriId, bantId, kalemler } = raw;
    const keys = listeKeys(kategoriId, bantId);

    for (const k of kalemler) {
      const poz = String(k.poz ?? "").trim();
      if (!poz) continue;

      const urunTipi = inferUrunTipiFromReferansSatir(k);
      const notlar = k.olcu && k.olcu !== "-" ? `Ölçü: ${k.olcu}` : undefined;
      const match = await matchReferansKalem({
        isim: String(k.ad ?? ""),
        urunTipi,
        referansPoz: poz,
        referansListeKey: `${kategoriId}-${bantId}`,
        notlar,
        olcu: k.olcu ?? null,
        fiyatStratejisi: "ekonomik",
      });

      const item = linkItemFromMatch(match);
      if (!item) {
        missed += 1;
        missLog.push(`${kategoriId}|${poz}: ${k.ad} (${k.olcu ?? "-"})`);
        continue;
      }

      for (const key of keys) {
        const linkKey = `${key}|${poz}`;
        if (links[linkKey]?.sku === item.sku) {
          skipped += 1;
          continue;
        }
        links[linkKey] = item;
        added += 1;
      }
    }
  }

  if (writeLinks) {
    fs.writeFileSync(LINKS_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  }

  console.log(
    `Bulut SKU ${writeLinks ? "seed" : "rapor"}: +${added} link, ${skipped} unchanged, ${missed} eşleşmedi`,
  );
  if (missLog.length) {
    console.log("\nEşleşmeyen pozlar:");
    for (const line of missLog) console.log(" ", line);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
