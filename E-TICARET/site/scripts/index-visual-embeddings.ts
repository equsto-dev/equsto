/**
 * Katalog ürün görselleri → Gemini embedding → Supabase pgvector
 *   npm run search:visual-index
 *   npm run search:visual-index -- --limit 100
 *   npm run search:visual-index -- --force
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.mjs";
import { PrismaClient } from "@prisma/client";
import { isBarDesignShopProduct } from "./lib/bar-design-shop-exclude.mjs";
import { embedImageFromUrl } from "../lib/search/gemini-image-embedding";
import { upsertVisualEmbedding } from "../lib/search/visual-embedding-db";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CDN =
  process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim().replace(/\/$/, "") ||
  "https://dqb0g8etbedva.cloudfront.net";

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 0;
const FORCE = args.includes("--force");
const DELAY_MS = Number(process.env.VISUAL_INDEX_DELAY_MS || 350);

const db = new PrismaClient();

function meiliId(raw: string) {
  return String(raw || "")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 500);
}

function productId(row: Record<string, unknown>, dept: string) {
  if (row.id) return meiliId(String(row.id));
  const sku = row.sku || row.model;
  if (sku) return meiliId(`${dept}__${sku}`);
  return "";
}

function firstImage(row: Record<string, unknown>) {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs[0]) return "";
  return String(imgs[0]).replace(/\\/g, "/");
}

function cdnUrl(rel: string) {
  const norm = rel.startsWith("/") ? rel : `/${rel}`;
  return `${DEFAULT_CDN}${norm}`;
}

function loadCatalogRows() {
  const out: Array<{ id: string; dept: string; image: string }> = [];
  const seen = new Set<string>();
  const ekipPath = path.join(ROOT, "var/catalog/ekipmanlar.json");

  function pushRow(row: Record<string, unknown>, deptFallback = "") {
    if (isBarDesignShopProduct(row)) return;
    const dept = String(row.dept || deptFallback || "").trim();
    const id = productId(row, dept);
    const image = firstImage(row);
    if (!id || !image || seen.has(id)) return;
    seen.add(id);
    out.push({ id, dept, image });
  }

  if (!fs.existsSync(ekipPath)) {
    throw new Error(`Katalog yok: ${ekipPath}`);
  }

  const rows = JSON.parse(fs.readFileSync(ekipPath, "utf8"));
  if (!Array.isArray(rows)) throw new Error("ekipmanlar.json dizi değil");
  for (const row of rows) pushRow(row as Record<string, unknown>);
  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error("[search:visual-index] GEMINI_API_KEY eksik");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[search:visual-index] DATABASE_URL eksik");
    process.exit(1);
  }

  let items = loadCatalogRows();
  if (LIMIT > 0) items = items.slice(0, LIMIT);
  console.log(`[search:visual-index] ${items.length} ürün görseli işlenecek`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const imageUrl = cdnUrl(item.image);

    if (!FORCE) {
      const existing = await db.$queryRawUnsafe<Array<{ product_id: string }>>(
        "SELECT product_id FROM product_visual_embedding WHERE product_id = $1 LIMIT 1",
        item.id,
      );
      if (existing.length) {
        skip++;
        continue;
      }
    }

    try {
      const embedded = await embedImageFromUrl(imageUrl);
      await upsertVisualEmbedding({
        productId: item.id,
        dept: item.dept,
        imageUrl,
        values: embedded.values,
      });
      ok++;
      if (ok % 25 === 0) {
        console.log(`[search:visual-index] ${ok} indekslendi (${i + 1}/${items.length})`);
      }
    } catch (err) {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[search:visual-index] atlandı ${item.id}: ${msg.slice(0, 120)}`);
    }

    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  const total = await db.$queryRawUnsafe<Array<{ c: bigint }>>(
    "SELECT COUNT(*)::bigint AS c FROM product_visual_embedding",
  );
  console.log(
    `[search:visual-index] OK — yeni: ${ok}, atlanan (zaten var): ${skip}, hata: ${fail}, toplam indeks: ${total[0]?.c ?? "?"}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
