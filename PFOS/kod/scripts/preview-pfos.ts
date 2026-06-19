import { PrismaClient } from "@prisma/client";
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
const db = new PrismaClient();
async function main() {
  const products = await db.product.findMany({
    where: { pfosUrunTipi: { not: null } },
    take: 10,
    include: { brand: true, category: true }
  });
  console.log("Previewing 10 matched products:");
  for (const p of products) {
    console.log(`- ${p.brand.name} | ${p.name} -> Type: ${p.pfosUrunTipi}, Cat: ${p.pfosKategoriKodu}`);
  }
}
main().finally(() => db.$disconnect());
