/**
 * Bulut referans → katalog eşleşme denetimi (SKU, katalog adı, uyumsuzluk).
 * Kullanım: node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs scripts/audit-bulut-eslestirme.mjs [kategoriId]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { matchReferansKalem, referansKatalogUyumsuz } from "../lib/pfos/referans/referans-eslestirme.ts";
import { inferUrunTipiFromReferansSatir } from "../lib/pfos/referans/infer-urun-tipi.ts";
import { loadLegacyCatalogRows } from "../lib/legacy-catalog.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const REF_DIR = path.join(SITE, "public", "data", "pfos-referans");

async function main() {
  const filter = process.argv[2]?.trim();
  const files = fs
    .readdirSync(REF_DIR)
    .filter((f) => f.startsWith("bulut-") && f.endsWith("-40-80.json"))
    .filter((f) => !filter || f.includes(filter))
    .sort();

  const rows = await loadLegacyCatalogRows();
  const bySku = new Map(rows.map((r) => [String(r.sku ?? "").trim(), r]));

  const issues = [];

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(REF_DIR, file), "utf8"));
    const listeKey = `${raw.kategoriId}-${raw.bantId}`;

    for (const k of raw.kalemler) {
      const poz = String(k.poz ?? "").trim();
      const urunTipi = inferUrunTipiFromReferansSatir(k);
      const notlar = k.olcu && k.olcu !== "-" ? `Ölçü: ${k.olcu}` : undefined;
      const match = await matchReferansKalem({
        isim: String(k.ad ?? ""),
        urunTipi,
        referansPoz: poz,
        referansListeKey: listeKey,
        notlar,
        olcu: k.olcu ?? null,
        fiyatStratejisi: "ekonomik",
      });

      const katRow = match?.sku ? bySku.get(match.sku) : null;
      const katAd = katRow?.ad ?? match?.ad ?? "";
      const uyumsuz =
        match?.sku &&
        referansKatalogUyumsuz(k.ad, katAd, notlar, match.sku);

      if (!match?.sku) {
        issues.push({
          sev: "eksik",
          liste: listeKey,
          poz,
          ref: k.ad,
          olcu: k.olcu ?? "-",
        });
        continue;
      }

      if (uyumsuz) {
        issues.push({
          sev: "uyumsuz",
          liste: listeKey,
          poz,
          ref: k.ad,
          sku: match.sku,
          kat: katAd.slice(0, 80),
        });
      }

      // Kapı sayısı / çekmece çelişkisi
      const refN = String(k.ad).toLocaleLowerCase("tr");
      const katN = String(katAd).toLocaleLowerCase("tr");
      if (/4\s*kap/i.test(refN) && /(cift|çift|2)\s*kap|iki\s*kap/i.test(katN) && !/4\s*kap/i.test(katN)) {
        issues.push({
          sev: "kapi",
          liste: listeKey,
          poz,
          ref: k.ad,
          sku: match.sku,
          kat: katAd.slice(0, 80),
        });
      }
      if (/cekmece|çekmece/i.test(refN) && /cift\s*kap|çift\s*kap|2\s*kap/i.test(katN) && !/cekmece|çekmece/i.test(katN)) {
        issues.push({
          sev: "cekmece",
          liste: listeKey,
          poz,
          ref: k.ad,
          sku: match.sku,
          kat: katAd.slice(0, 80),
        });
      }
    }
  }

  const bySev = Object.groupBy(issues, (i) => i.sev);
  for (const [sev, list] of Object.entries(bySev)) {
    console.log(`\n=== ${sev.toUpperCase()} (${list.length}) ===`);
    for (const i of list.slice(0, 40)) {
      console.log(`${i.liste}|${i.poz}: ${i.ref}`);
      if (i.sku) console.log(`  → ${i.sku} | ${i.kat}`);
    }
    if (list.length > 40) console.log(`  ... +${list.length - 40} daha`);
  }
  console.log(`\nToplam sorun: ${issues.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
