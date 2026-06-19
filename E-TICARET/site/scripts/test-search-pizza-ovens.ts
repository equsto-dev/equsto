import { db } from "../lib/db";

async function main() {
  console.log("Searching database for names containing 'kubbe'...");
  const products = await db.product.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { name: { contains: "kubbe", mode: "insensitive" } },
        { name: { contains: "dome", mode: "insensitive" } },
        { name: { contains: "döner taban", mode: "insensitive" } },
        { name: { contains: "doner taban", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      sku: true,
      name: true,
      priceListTl: true,
      pfosUrunTipi: true,
      brand: {
        select: {
          name: true,
        }
      }
    },
  });

  console.log(`Found ${products.length} products total.`);
  products.forEach((p) => {
    console.log(
      `SKU: ${p.sku?.padEnd(20)} | Brand: ${(p.brand?.name || "—").slice(0, 15).padEnd(15)} | Name: ${p.name.slice(0, 50).padEnd(50)} | Price: ${(p.priceListTl ? Number(p.priceListTl) : 0).toLocaleString("tr-TR").padStart(10)} TL | pfosUrunTipi: ${p.pfosUrunTipi}`
    );
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
