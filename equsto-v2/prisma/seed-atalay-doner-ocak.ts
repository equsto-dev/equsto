import "../scripts/load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/atalay-doner-ocak.json");

type CatalogProduct = {
  modelCode: string;
  slug: string;
  name: string;
  section: string;
  energi: string;
  radyan: string;
  el_guc: string | null;
  gaz_guc: string | null;
  voltaj: string;
  priceEuroCatalog: number;
  priceEuroSite: number;
  priceTl: number;
  imagePath: string;
};

async function main() {
  await prisma.product.deleteMany({
    where: {
      OR: [
        { modelCode: { startsWith: "ATALAY-DEMO" } },
        { slug: { in: ["atalay-ornek-firin", "atalay-ornek-dolap"] } },
      ],
    },
  });

  const raw = JSON.parse(fs.readFileSync(CATALOG, "utf8")) as {
    products: CatalogProduct[];
    discountPercent: number;
    eurTryRate: number;
  };

  const atalay = await prisma.brand.upsert({
    where: { slug: "atalay" },
    update: { name: "Atalay" },
    create: {
      slug: "atalay",
      name: "Atalay",
      description: "Atalay Makina — yerli mutfak ekipmanları",
    },
  });

  const pisirme = await prisma.category.upsert({
    where: { slug: "pisirme" },
    update: {},
    create: { slug: "pisirme", name: "Pişirme", order: 10 },
  });

  const doner = await prisma.category.upsert({
    where: { slug: "doner-ocak" },
    update: { name: "Döner ocakları", order: 15, parentId: pisirme.id },
    create: {
      slug: "doner-ocak",
      name: "Döner ocakları",
      description: "Atalay döner makineleri / ocakları",
      order: 15,
      parentId: pisirme.id,
    },
  });

  let n = 0;
  for (const p of raw.products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        modelCode: p.modelCode,
        description: `Atalay ${p.modelCode} — ${p.section}. Katalog ${p.priceEuroCatalog} EUR; site %${raw.discountPercent} iskonto. TRY: TCMB efektif satış ile anlık hesaplanır.`,
        priceListTl: p.priceTl,
        priceCurrency: "TRY",
        status: "PUBLISHED",
        brandId: atalay.id,
        categoryId: doner.id,
        specs: {
          seri: "Döner Makineleri",
          section: p.section,
          energi: p.energi,
          radyan: p.radyan,
          voltaj: p.voltaj,
          el_guc: p.el_guc,
          gaz_guc: p.gaz_guc,
          gorsel_url: p.imagePath,
          fiyat_euro_katalog: p.priceEuroCatalog,
          fiyat_euro_site: p.priceEuroSite,
          iskonto_oran: raw.discountPercent / 100,
        },
      },
      create: {
        slug: p.slug,
        modelCode: p.modelCode,
        name: p.name,
        description: `Atalay ${p.modelCode} — ${p.section}. Katalog ${p.priceEuroCatalog} EUR; site %${raw.discountPercent} iskonto.`,
        priceListTl: p.priceTl,
        priceCurrency: "TRY",
        status: "PUBLISHED",
        brandId: atalay.id,
        categoryId: doner.id,
        specs: {
          seri: "Döner Makineleri",
          section: p.section,
          energi: p.energi,
          radyan: p.radyan,
          voltaj: p.voltaj,
          el_guc: p.el_guc,
          gaz_guc: p.gaz_guc,
          gorsel_url: p.imagePath,
          fiyat_euro_katalog: p.priceEuroCatalog,
          fiyat_euro_site: p.priceEuroSite,
          iskonto_oran: 0.4,
        },
        images: {
          create: {
            url: p.imagePath,
            alt: p.name,
            isPrimary: true,
            order: 0,
          },
        },
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.imagePath,
        alt: p.name,
        isPrimary: true,
        order: 0,
      },
    });
    n++;
  }

  console.log(`[seed-doner] ${n} ürün PUBLISHED (doner-ocak / Atalay)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
