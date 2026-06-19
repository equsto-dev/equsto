import { PrismaClient } from "@prisma/client";
// if (process.env.DIRECT_URL) {
//   process.env.DATABASE_URL = process.env.DIRECT_URL;
// }
const db = new PrismaClient();
async function main() {
  const total = await db.product.count();
  const c = await db.product.count({
    where: { pfosUrunTipi: { not: null } }
  });
  const pub = await db.product.count({
    where: { status: "PUBLISHED" }
  });
  const pubPfos = await db.product.count({
    where: { pfosUrunTipi: { not: null }, status: "PUBLISHED", pfosAktif: true }
  });
  console.log("Total products in DB:", total);
  console.log("Populated products in DB:", c);
  console.log("Published products in DB:", pub);
  console.log("Published & Active PFOS products in DB:", pubPfos);
}
main().finally(() => db.$disconnect());
