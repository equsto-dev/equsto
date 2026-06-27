/**
 * Bulut mutfak teklif eşleşme özeti — npm run pfos:bulut:match-check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateUnifiedQuote } from "../lib/pfos/core/unified-motor.ts";
import { buildTemplateFromShopType } from "../lib/pfos/proje-akis/shop-type-referans.ts";
import { PFOS_KONSEPT_SHOP_TYPES } from "../lib/pfos/proje-akis/konsept-tanimlari.ts";
import { clearMatchProductCache } from "../lib/pfos/core/match-product.ts";
import { clearShopCatalogCache } from "../lib/pfos/core/shop-catalog-match.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BULUT = PFOS_KONSEPT_SHOP_TYPES.filter(
  (t) => t.parent === "Bulut Mutfak" && t.pfos.durum === "aktif",
);

clearMatchProductCache();
clearShopCatalogCache();

let totalMiss = 0;

for (const shop of BULUT) {
  const template = await buildTemplateFromShopType(shop, 60);
  if (!template) {
    console.log(`[${shop.pfos.motorSlug}] şablon yok`);
    continue;
  }
  const r = await calculateUnifiedQuote(
    {
      konsept: shop.pfos.motorSlug,
      m2: 60,
      sehir: "İstanbul",
      fiyatStratejisi: "ekonomik",
    },
    template,
  );
  const eksik = r.kalemler.filter((k) => k.tip === "zorunlu" && !k.urun);
  totalMiss += eksik.length;
  console.log(
    `[${shop.pfos.motorSlug}] ${r.ozet.eslesmisZorunluSayisi}/${r.ozet.zorunluKalemSayisi} zorunlu | fiyat: ${Math.round(r.ozet.toplamFiyat ?? 0).toLocaleString("tr-TR")} TRY`,
  );
  if (eksik.length) {
    console.log(
      "  eksik:",
      eksik.map((k) => `${k.referansPoz ?? "?"} ${k.isim}`).join("; "),
    );
  }
}

console.log(`\nToplam eksik zorunlu kalem: ${totalMiss}`);
process.exit(totalMiss > 0 ? 1 : 0);
