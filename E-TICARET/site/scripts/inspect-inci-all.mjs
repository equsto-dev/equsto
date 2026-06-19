import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany({
    where: {
      OR: [
        { sku: { contains: "inci", mode: "insensitive" } },
        { sku: { contains: "ıncı", mode: "insensitive" } },
        { name: { contains: "inci", mode: "insensitive" } },
        { name: { contains: "ıncı", mode: "insensitive" } }
      ]
    },
    select: { sku: true, name: true, images: true },
    orderBy: { sku: "asc" }
  });
  console.log("=== INCI PRODUCTS ===");
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
