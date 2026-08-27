import "../scripts/load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../lib/prisma";

const prisma = new PrismaClient();
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOGUTMA_JSON = path.join(ROOT, "public/data/dept/sogutma.json");

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

async function main() {
  if (!fs.existsSync(SOGUTMA_JSON)) {
    console.error("sogutma.json not found, run scripts/import-brema.mjs first.");
    process.exit(1);
  }

  console.log("Loading Brema products from JSON...");
  const rawProducts = JSON.parse(fs.readFileSync(SOGUTMA_JSON, "utf8")) as any[];
  const bremaRaw = rawProducts.filter((p: any) => p.oem_brand === "Brema" || p.brand === "Krom Mutfak San. Tic. A.Ş.");

  if (bremaRaw.length === 0) {
    console.warn("No Brema products found in sogutma.json. Run import script first.");
    return;
  }

  console.log(`Found ${bremaRaw.length} Brema products in JSON. Upserting brand & category in database...`);

    // Ensure Brema brand exists
  const brand = await prisma.brand.upsert({
    where: { slug: "brema" },
    update: { name: "Brema", description: "Brema Ice Makers — İtalyan buz makineleri üreticisi." },
    create: {
      slug: "brema",
      name: "Brema",
      description: "Brema Ice Makers — İtalyan buz makineleri üreticisi.",
    },
  });

  // Ensure Soğutma parent category exists
  const sogutma = await prisma.category.upsert({
    where: { slug: "sogutma" },
    update: { name: "Soğutma" },
    create: { slug: "sogutma", name: "Soğutma", order: 20 },
  });

  // Ensure Buz Makineleri category exists under Soğutma
  const category = await prisma.category.upsert({
    where: { slug: "buz-makineleri" },
    update: { name: "Buz Makineleri", parentId: sogutma.id, description: "Küp, kar, granül ve dispenserli profesyonel buz makineleri." },
    create: {
      slug: "buz-makineleri",
      name: "Buz Makineleri",
      description: "Küp, kar, granül ve dispenserli profesyonel buz makineleri.",
      parentId: sogutma.id,
      order: 5,
    },
  });

  console.log("Upserting products into database...");
  let count = 0;
  for (const item of bremaRaw) {
    const slug = slugify(`brema-${item.model}`);
    
    // Parse specs if JSON or keep as object
    const specsJson: any = {
      brand: item.brand,
      oem_brand: item.oem_brand,
      fiyat_euro_katalog: item.liste_fiyati_eur,
      fiyat_euro_site: item.satis_fiyati_eur,
      iskonto_oran: item.bayi_iskonto,
      pdf_sayfalar: item.pdf_sayfalar,
    };

    if (item.olculer) {
      specsJson.boyutlar = item.olculer.boyutlar;
      specsJson.agirlik = item.olculer.agirlik;
      specsJson.el_guc = item.olculer.guc_kw;
    }

    const elektrikGucuKw = item.olculer?.guc_kw ? parseFloat(item.olculer.guc_kw) : null;

    const dbProduct = await prisma.product.upsert({
      where: { slug },
      update: {
        name: item.name,
        modelCode: item.model,
        sku: item.sku,
        description: item.specs,
        priceListTl: item.fiyat_tl,
        priceCurrency: "TRY",
        fiyatListe: item.liste_fiyati_eur,
        dovizListe: "EUR",
        bayiIskonto: item.bayi_iskonto,
        stok: 0,
        pfosAktif: true,
        ecommerceAktif: true,
        status: "PUBLISHED",
        brandId: brand.id,
        categoryId: category.id,
        specs: specsJson,
        elektrikGucuKw: elektrikGucuKw,
      },
      create: {
        slug,
        modelCode: item.model,
        sku: item.sku,
        name: item.name,
        description: item.specs,
        priceListTl: item.fiyat_tl,
        priceCurrency: "TRY",
        fiyatListe: item.liste_fiyati_eur,
        dovizListe: "EUR",
        bayiIskonto: item.bayi_iskonto,
        stok: 0,
        pfosAktif: true,
        ecommerceAktif: true,
        status: "PUBLISHED",
        brandId: brand.id,
        categoryId: category.id,
        specs: specsJson,
        elektrikGucuKw: elektrikGucuKw,
        images: {
          create: {
            url: "images/catalog/brema/placeholder.png",
            alt: item.name,
            isPrimary: true,
            order: 0,
          },
        },
      },
    });

    // Handle primary image for update path
    const hasImage = await prisma.productImage.findFirst({
      where: { productId: dbProduct.id }
    });
    if (!hasImage) {
      await prisma.productImage.create({
        data: {
          productId: dbProduct.id,
          url: "images/catalog/brema/placeholder.png",
          alt: item.name,
          isPrimary: true,
          order: 0,
        }
      });
    }

    count++;
  }

  console.log(`[seed-brema] ${count} Brema products successfully seeded and marked as PUBLISHED.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
