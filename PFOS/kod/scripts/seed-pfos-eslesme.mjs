/**
 * scripts/seed-pfos-eslesme.mjs
 * npx tsx scripts/seed-pfos-eslesme.mjs
 */
import "./load-env.mjs";
import { PrismaClient } from "@prisma/client";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const db = new PrismaClient();

async function main() {
  console.log("[seed-pfos-eslesme] Loading products from database...");
  
  // Fetch all products that have a pfosUrunTipi and are active
  const products = await db.product.findMany({
    where: {
      pfosAktif: true,
      status: "PUBLISHED",
      pfosUrunTipi: { not: null },
      priceListTl: { gt: 0 }
    },
    include: {
      brand: true
    }
  });

  console.log(`[seed-pfos-eslesme] Found ${products.length} active products with PFOS type.`);

  // Group products by pfosUrunTipi
  const grouped = new Map();
  for (const product of products) {
    const tip = product.pfosUrunTipi;
    if (!grouped.has(tip)) {
      grouped.set(tip, []);
    }
    grouped.get(tip).push(product);
  }

  console.log(`[seed-pfos-eslesme] Grouped into ${grouped.size} unique product types.`);
  console.log("[seed-pfos-eslesme] Seeding PfosUrunTipiEslesme...");

  let seededCount = 0;

  for (const [pfosUrunTipi, items] of grouped.entries()) {
    // Sort items so that the lowest priced product is prioritized (highest oncelik)
    const sorted = [...items].sort((a, b) => Number(a.priceListTl) - Number(b.priceListTl));

    for (let i = 0; i < sorted.length; i++) {
      const product = sorted[i];
      // Highest priority (oncelik) goes to the lowest price (first in sorted list)
      const oncelik = (sorted.length - i) * 10;
      
      const pfosKategoriKodu = product.pfosKategoriKodu || "B";

      await db.pfosUrunTipiEslesme.upsert({
        where: {
          konseptSlug_pfosUrunTipi_productId: {
            konseptSlug: "*",
            pfosUrunTipi,
            productId: product.id
          }
        },
        update: {
          pfosKategoriKodu,
          oncelik,
          zorunlu: i === 0 // Mark the primary/cheapest candidate as default (zorunlu)
        },
        create: {
          konseptSlug: "*",
          pfosUrunTipi,
          pfosKategoriKodu,
          productId: product.id,
          oncelik,
          zorunlu: i === 0
        }
      });
      seededCount++;
    }
  }

  console.log(`[seed-pfos-eslesme] Successfully seeded ${seededCount} mappings into PfosUrunTipiEslesme.`);
}

main()
  .catch((e) => {
    console.error("[seed-pfos-eslesme] Error:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
