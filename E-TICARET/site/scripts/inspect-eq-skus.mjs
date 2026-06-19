import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany({
    where: {
      sku: { contains: "EQ-", mode: "insensitive" }
    },
    select: { sku: true, name: true },
    orderBy: { sku: "asc" },
    take: 100
  });
  console.log("=== EQ- SKUs ===");
  console.log(products);
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
