import { calculateUnifiedQuote } from "../lib/pfos/core/unified-motor.ts";
import { getTemplate, resolveTemplateForQuote } from "../lib/pfos/core/templates/index.ts";
import { clearMatchProductCache } from "../lib/pfos/core/match-product.ts";
import { clearShopCatalogCache } from "../lib/pfos/core/shop-catalog-match.ts";
import { db } from "../lib/db.ts";

const KONSEPTLER = [
  { konsept: "coffee-shop", m2: 120 },
  { konsept: "pizzaci", m2: 150 },
  { konsept: "turk-restoran", m2: 200 },
  { konsept: "meyhane", m2: 180 },
  { konsept: "kebap-ortadogu", m2: 220 },
  { konsept: "all-day-dining-cafe", m2: 280 },
] ;

clearMatchProductCache();
clearShopCatalogCache();

const pfosCount = await db.product.count({
  where: { pfosUrunTipi: { not: null }, pfosAktif: true },
});
console.log("pfos products in DB:", pfosCount);
console.log("---");

for (const { konsept, m2 } of KONSEPTLER) {
  const template = await resolveTemplateForQuote(konsept, m2);
  const r = await calculateUnifiedQuote(
    {
      konsept,
      m2,
      sehir: "İstanbul",
      fiyatStratejisi: "ekonomik",
    },
    template,
  );

  const eksik = r.kalemler.filter((k) => k.tip === "zorunlu" && !k.urun);
  const shopEslesen = r.kalemler.filter((k) => k.urun?.id.startsWith("ecom_"));
  const zoneEslesen = r.kalemler.filter((k) => k.urun?.id.startsWith("catalog-"));

  console.log(`[${konsept}] ${m2} m²`);
  console.log(
    "  kalemler:",
    r.kalemler.length,
    "| eslesme:",
    r.ozet.eslesmeSayisi,
    "/",
    r.ozet.toplamKalemSayisi,
  );
  console.log(
    "  zorunlu eslesme:",
    r.ozet.eslesmisZorunluSayisi,
    "/",
    r.ozet.zorunluKalemSayisi,
  );
  console.log(
    "  toplamFiyat:",
    r.ozet.toplamFiyat?.toLocaleString("tr-TR") ?? "—",
    "TRY",
  );
  console.log(
    "  kaynak: shop",
    shopEslesen.length,
    "| zone",
    zoneEslesen.length,
  );
  if (eksik.length) {
    console.log(
      "  EKSIK zorunlu:",
      eksik.map((k) => k.isim).join(", "),
    );
  }
  console.log("");
}

await db.$disconnect();
