/**
 * specs.gorsel_url → ProductImage backfill (ProductImage tablosu boş olanlar)
 *
 *   npm run db:backfill:images
 *   npm run db:backfill:images -- --dry-run
 *   npm run db:backfill:images -- --limit 100
 */
import "../scripts/load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "../lib/prisma";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");
const PFOS_EK = path.join(ROOT, "public/data/pfos-ek-katalog.json");

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1]
      ? Math.max(1, parseInt(argv[limitIdx + 1], 10) || 0)
      : 0;
  const batchIdx = argv.indexOf("--batch");
  const batchSize =
    batchIdx >= 0 && argv[batchIdx + 1]
      ? Math.max(10, parseInt(argv[batchIdx + 1], 10) || 100)
      : 200;
  return { dryRun, limit, batchSize };
}

type JsonRow = {
  id?: string;
  sku?: string;
  images?: string[];
};

function loadJsonImageMap(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (row: JsonRow) => {
    const img = row.images?.[0];
    if (!img) return;
    const url = normalizeGorselUrl(img);
    if (!url) return;
    if (row.id) map.set(`id:${row.id}`, url);
    if (row.sku) map.set(`sku:${row.sku}`, url);
  };
  if (fs.existsSync(EKIPMANLAR)) {
    const rows = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8")) as JsonRow[];
    for (const row of rows) add(row);
  }
  if (fs.existsSync(PFOS_EK)) {
    const extra = JSON.parse(fs.readFileSync(PFOS_EK, "utf8")) as { items?: JsonRow[] };
    for (const row of extra.items || []) add(row);
  }
  return map;
}

function resolveFromJson(
  map: Map<string, string>,
  sku: string | null,
  specs: Record<string, unknown>,
): string | null {
  const ekipId = specs.ekipmanlar_id;
  if (typeof ekipId === "string" && map.has(`id:${ekipId}`)) {
    return map.get(`id:${ekipId}`)!;
  }
  if (sku && map.has(`sku:${sku}`)) return map.get(`sku:${sku}`)!;
  return null;
}

function normalizeGorselUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let p = raw.trim().replace(/\\/g, "/");
  if (!p) return null;
  p = p.replace(/^\.\//, "");
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return p.slice(1);
  return p;
}

async function main() {
  const { dryRun, limit, batchSize } = parseArgs();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL yok — .env.local doldurun");
  }

  const jsonImages = loadJsonImageMap();
  console.log(`  JSON görsel haritası: ${jsonImages.size} kayıt`);

  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true, name: true, sku: true, specs: true },
    take: limit > 0 ? limit : undefined,
    orderBy: { id: "asc" },
  });

  let created = 0;
  let skipped = 0;
  let specsPatched = 0;
  const missing: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const specs =
      p.specs && typeof p.specs === "object" && !Array.isArray(p.specs)
        ? (p.specs as Record<string, unknown>)
        : {};
    let url = normalizeGorselUrl(specs.gorsel_url);
    if (!url) {
      url = resolveFromJson(jsonImages, p.sku, specs);
      if (url && !dryRun) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            specs: { ...specs, gorsel_url: url } as Prisma.InputJsonValue,
          },
        });
        specsPatched++;
      }
    }
    if (!url) {
      skipped++;
      if (missing.length < 20) missing.push(String(p.sku || p.id));
      continue;
    }

    if (!dryRun) {
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url,
          alt: p.name,
          isPrimary: true,
          order: 0,
        },
      });
    }
    created++;

    if ((i + 1) % batchSize === 0 || i + 1 === products.length) {
      console.log(`  … ${i + 1} / ${products.length} (oluşturulan ${created}, atlanan ${skipped})`);
    }
  }

  const withImage = await prisma.product.count({ where: { images: { some: {} } } });
  const total = await prisma.product.count();
  const noImg = await prisma.product.count({ where: { images: { none: {} } } });

  console.log(
    `[backfill-images] ${dryRun ? "DRY-RUN · " : ""}ProductImage +${created}, specs güncellenen ${specsPatched}, gorsel_url yok ${skipped}`,
  );
  console.log(`  DB: ProductImage olan ${withImage} / ${total}, hâlâ görsel yok ${noImg}`);
  if (missing.length) console.log("  gorsel_url eksik SKU örnek:", missing.slice(0, 10));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
