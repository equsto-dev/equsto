import "../scripts/load-env.mjs";
import { PrismaClient } from "../lib/prisma";

const prisma = new PrismaClient();

async function main() {
  const atalay = await prisma.brand.upsert({
    where: { slug: "atalay" },
    update: { name: "Atalay" },
    create: {
      slug: "atalay",
      name: "Atalay",
      description: "Sprint 0 omurga markası — mutfak ekipmanları",
    },
  });

  const pisirme = await prisma.category.upsert({
    where: { slug: "pisirme" },
    update: { name: "Pişirme" },
    create: { slug: "pisirme", name: "Pişirme", order: 10 },
  });

  const sogutma = await prisma.category.upsert({
    where: { slug: "sogutma" },
    update: { name: "Soğutma" },
    create: { slug: "sogutma", name: "Soğutma", order: 20 },
  });

  await prisma.product.upsert({
    where: { slug: "atalay-ornek-firin" },
    update: {},
    create: {
      slug: "atalay-ornek-firin",
      modelCode: "ATALAY-DEMO-001",
      name: "Atalay Konveksiyonel Fırın (örnek)",
      description: "Sprint 0 seed ürünü — yayın öncesi DRAFT.",
      brandId: atalay.id,
      categoryId: pisirme.id,
      priceListTl: 125000,
      status: "DRAFT",
      specs: { kapasite: "10 tepsi", guc: "12 kW" },
      images: {
        create: {
          url: "/images/equsto-logo.png",
          alt: "Atalay örnek",
          isPrimary: true,
          order: 0,
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "atalay-ornek-dolap" },
    update: {},
    create: {
      slug: "atalay-ornek-dolap",
      modelCode: "ATALAY-DEMO-002",
      name: "Atalay Soğutmalı Tezgah (örnek)",
      brandId: atalay.id,
      categoryId: sogutma.id,
      status: "DRAFT",
      specs: { hacim: "400 L" },
    },
  });

  console.log("[seed] Atalay + 2 örnek ürün hazır");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
