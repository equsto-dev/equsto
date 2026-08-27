import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  
  console.log("=== YER OCAKLARI ===");
  const products = await prisma.product.findMany({
    where: {
      name: { contains: "yer oca", mode: 'insensitive' },
      pfosAktif: true
    },
    select: { sku: true, name: true, priceListTl: true, brand: { select: { name: true } } },
    take: 15
  });
  for (const p of products) {
    console.log(`- [${p.brand.name}] ${p.sku} | ${p.name} | ${p.priceListTl} TL`);
  }

  await prisma.$disconnect();
}
main().catch(console.error);
