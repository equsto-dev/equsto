/**
 * equsto-katalog-master.json → Supabase Product (EQ- kodları)
 * Kaynak: PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx (ana besleyici)
 *   npm run catalog:master:prisma
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTER = path.join(ROOT, "public/data/equsto-katalog-master.json");
const MASTER_XLSX_FILENAME = "ÜRÜN KATEGORİZASYONU-DOLU.xlsx";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const db = new PrismaClient();

/** İNOKSAN → INOKSAN (EQ- kodları ASCII) */
function asciiUpper(s: string): string {
  return String(s || "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .toUpperCase();
}

function normalizeEqustoKod(kod: string): string {
  const raw = String(kod || "").trim();
  if (!raw) return "";
  const body = raw.startsWith("EQ-") ? raw.slice(3) : raw;
  const dot = body.indexOf(".");
  if (dot > 0) {
    const brand = asciiUpper(body.slice(0, dot));
    const rest = body.slice(dot + 1);
    return `EQ-${brand}.${rest}`;
  }
  return `EQ-${asciiUpper(body)}`;
}

function normalizeBrandKod(kod: string): string {
  return asciiUpper(kod);
}

function slugify(s: string): string {
  return asciiUpper(s)
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normSku(s: string): string {
  return String(s || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

const brandCache = new Map<string, string>();
const categoryCache = new Map<string, string>();

async function getBrandId(marka: string, markaKodu: string): Promise<string> {
  const kod = normalizeBrandKod(markaKodu);
  const key = kod || marka;
  const cached = brandCache.get(key);
  if (cached) return cached;

  const slug = slugify(marka || kod || "marka");
  const brand = await db.brand.upsert({
    where: { slug },
    update: { kod: kod || undefined, name: marka || slug },
    create: {
      slug,
      name: marka || slug,
      kod: kod || null,
    },
  });
  brandCache.set(key, brand.id);
  return brand.id;
}

async function getCategoryId(
  urunKategori: string,
  urunAltKategori: string,
  dept: string,
): Promise<string> {
  const label = urunAltKategori || urunKategori || dept;
  const cached = categoryCache.get(label);
  if (cached) return cached;

  const slug = slugify(label || dept || "diger");
  const category = await db.category.upsert({
    where: { slug },
    update: { name: label },
    create: {
      slug,
      name: label,
      depth: urunAltKategori ? 1 : 0,
    },
  });
  categoryCache.set(label, category.id);
  return category.id;
}

type LookupMaps = {
  bySku: Map<string, string>;
  byEqusto: Map<string, string>;
  bySlug: Map<string, string>;
  byBrandModel: Map<string, string>;
};

function resolveProductId(
  maps: LookupMaps,
  input: {
    equstoKod: string;
    sku: string;
    slug: string;
    brandId: string;
    modelCode: string;
  },
): string | undefined {
  const eq = normalizeEqustoKod(input.equstoKod);
  return (
    maps.byEqusto.get(eq) ||
    maps.byEqusto.get(input.equstoKod.toUpperCase()) ||
    (input.sku ? maps.bySku.get(normSku(input.sku)) : undefined) ||
    maps.bySlug.get(input.slug) ||
    maps.byBrandModel.get(`${input.brandId}::${input.modelCode}`)
  );
}

function registerProduct(maps: LookupMaps, row: {
  id: string;
  equstoKod: string;
  sku: string;
  slug: string;
  brandId: string;
  modelCode: string;
}) {
  const eq = normalizeEqustoKod(row.equstoKod);
  maps.byEqusto.set(eq, row.id);
  if (row.sku) maps.bySku.set(normSku(row.sku), row.id);
  if (row.slug) maps.bySlug.set(row.slug, row.id);
  if (row.brandId && row.modelCode) {
    maps.byBrandModel.set(`${row.brandId}::${row.modelCode}`, row.id);
  }
}

async function main() {
  if (!fs.existsSync(MASTER)) {
    throw new Error(
      `equsto-katalog-master.json yok — önce npm run catalog:master:import-xlsx (${MASTER_XLSX_FILENAME})`,
    );
  }

  const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));
  const products = master.products || [];

  console.log("[master:prisma] DB ürünleri yükleniyor...");
  const existing = await db.product.findMany({
    select: {
      id: true,
      sku: true,
      slug: true,
      equstoKod: true,
      brandId: true,
      modelCode: true,
    },
  });

  const maps: LookupMaps = {
    bySku: new Map(),
    byEqusto: new Map(),
    bySlug: new Map(),
    byBrandModel: new Map(),
  };

  for (const row of existing) {
    registerProduct(maps, {
      id: row.id,
      equstoKod: row.equstoKod || "",
      sku: row.sku || "",
      slug: row.slug,
      brandId: row.brandId,
      modelCode: row.modelCode,
    });
  }
  console.log("[master:prisma] DB'de", existing.length, "ürün");

  let updated = 0;
  let created = 0;
  let skip = 0;
  let err = 0;

  for (const p of products) {
    if (!p.equsto_kod || !p.dept) {
      skip++;
      continue;
    }

    const equstoKod = normalizeEqustoKod(p.equsto_kod);
    const markaKodu = normalizeBrandKod(p.marka_kodu || "");

    try {
      const brandId = await getBrandId(p.marka, markaKodu);
      const categoryId = await getCategoryId(
        p.urun_kategori,
        p.urun_alt_kategori,
        p.dept,
      );

      const modelCode =
        p.marka_urun_kodu || equstoKod.replace(/^EQ-[^.]+\./, "");
      const sku = p.marka_urun_kodu || modelCode;
      const slug = slugify(equstoKod);

      const data = {
        equstoKod,
        urunKodu: p.marka_urun_kodu || null,
        name: p.aciklama || modelCode,
        description: p.aciklama || null,
        detayliAciklama: p.teknik_ozellikler || null,
        fiyatKdvHaricDoviz: p.fiyat_eur ?? null,
        priceListTl: p.fiyat_tl ?? null,
        brandId,
        categoryId,
        modelCode,
        sku,
      };

      const productId = resolveProductId(maps, {
        equstoKod,
        sku,
        slug,
        brandId,
        modelCode,
      });

      if (productId) {
        await db.product.update({ where: { id: productId }, data });
        registerProduct(maps, {
          id: productId,
          equstoKod,
          sku,
          slug,
          brandId,
          modelCode,
        });
        updated++;
      } else {
        try {
          const row = await db.product.create({
            data: { ...data, slug, status: "PUBLISHED" },
          });
          registerProduct(maps, {
            id: row.id,
            equstoKod,
            sku,
            slug,
            brandId,
            modelCode,
          });
          created++;
        } catch (createErr) {
          const fallbackId = maps.bySlug.get(slug) || maps.bySku.get(normSku(sku));
          if (fallbackId) {
            await db.product.update({ where: { id: fallbackId }, data });
            registerProduct(maps, {
              id: fallbackId,
              equstoKod,
              sku,
              slug,
              brandId,
              modelCode,
            });
            updated++;
          } else {
            throw createErr;
          }
        }
      }

      if ((updated + created) % 500 === 0) {
        console.log("[master:prisma]", updated + created, "...");
      }
    } catch (e) {
      err++;
      if (err <= 8) {
        console.warn(
          "[master:prisma] hata:",
          equstoKod,
          e instanceof Error ? e.message.split("\n")[0] : e,
        );
      }
    }
  }

  const withEq = await db.product.count({
    where: { equstoKod: { not: null } },
  });
  const brandsWithKod = await db.brand.count({
    where: { kod: { not: null } },
  });

  console.log(
    "[master:prisma] güncellendi:",
    updated,
    "yeni:",
    created,
    "atlandı:",
    skip,
    "hata:",
    err,
  );
  console.log("[master:prisma] DB equstoKod dolu:", withEq);
  console.log("[master:prisma] Brand.kod dolu:", brandsWithKod);
}

main()
  .catch((e) => {
    console.error("[master:prisma]", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
