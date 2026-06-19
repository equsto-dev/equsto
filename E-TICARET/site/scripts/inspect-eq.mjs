import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Searching for targeted products...");
  
  // 1. Microwave / Turbo Oven / APF
  const micro = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: "mikrodalga", mode: "insensitive" } },
        { name: { contains: "turbo", mode: "insensitive" } },
        { name: { contains: "apf-", mode: "insensitive" } },
        { sku: { contains: "apf", mode: "insensitive" } }
      ]
    },
    select: { id: true, sku: true, name: true, priceListTl: true }
  });
  console.log("=== MICROWAVE ===");
  console.log(micro);

  // 2. Portashelf trash trolley / MB126X / çöp arabası
  const trash = await db.product.findMany({
    where: {
      OR: [
        { sku: { contains: "MB126", mode: "insensitive" } },
        { name: { contains: "çöp arab", mode: "insensitive" } },
        { name: { contains: "cop arab", mode: "insensitive" } }
      ]
    },
    select: { id: true, sku: true, name: true, priceListTl: true }
  });
  console.log("=== TRASH TROLLEY ===");
  console.log(trash);

  // 3. Toast machine / döner sarma / döner kesme
  const toast = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: "tost", mode: "insensitive" } },
        { name: { contains: "döner", mode: "insensitive" } },
        { name: { contains: "doner", mode: "insensitive" } }
      ]
    },
    select: { id: true, sku: true, name: true, priceListTl: true },
    take: 30
  });
  console.log("=== TOAST / DONER ===");
  console.log(toast);

  // 4. Çağlayan cake displays (Inci, etc.)
  const caglayan = await db.product.findMany({
    where: {
      AND: [
        { sku: { contains: "EQ-", mode: "insensitive" } },
        { name: { contains: "inci", mode: "insensitive" } }
      ]
    },
    select: { id: true, sku: true, name: true, priceListTl: true }
  });
  console.log("=== CAGLAYAN INCI ===");
  console.log(caglayan);
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
