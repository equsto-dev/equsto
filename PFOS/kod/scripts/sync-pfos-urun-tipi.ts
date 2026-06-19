/**
 * scripts/sync-pfos-urun-tipi.ts
 * npx tsx scripts/sync-pfos-urun-tipi.ts
 */
import { PrismaClient, PfosKategoriKodu } from "@prisma/client";
import { productMatchesTipKodu } from "../lib/pfos/core/shop-catalog-match";
import { URUN_TIPI_ALIASES } from "../lib/pfos/core/tip-kodu";
import type { AdminUrunRow } from "../lib/legacy-catalog";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const db = new PrismaClient();

// Reverse map tip_kodu to primary/specific aliases
function getBestAlias(tipKodu: string, name: string): string {
  const n = name.toLowerCase();
  if (tipKodu === "dik_tip_buzdolabi") {
    if (n.includes("tek kap") || n.includes("1 kap")) return "depo-buzdolabi-tek-kapili";
    return "dik-buzdolabı-depo";
  }
  if (tipKodu === "ocak_4gz") {
    if (n.includes("2 goz") || n.includes("2 göz")) return "ocak-2-gozlu";
    return "ocak-4-gozlu";
  }
  if (tipKodu === "fritoz_tek") {
    if (n.includes("cift") || n.includes("çift")) return "friteuse-cift-hazneli";
    return "friteuse-setustü";
  }
  if (tipKodu === "derin_dondurucu_dik") {
    if (n.includes("cift") || n.includes("çift")) return "depo-derin-dondurucu-cift-kapili";
    return "depo-derin-dondurucu";
  }
  
  const aliases = Object.keys(URUN_TIPI_ALIASES).filter(k => URUN_TIPI_ALIASES[k] === tipKodu);
  return aliases[0] || tipKodu.replace(/_/g, "-");
}

function getKategoriKodu(tipKodu: string, urunTipi: string): PfosKategoriKodu {
  const t = tipKodu.toLowerCase();
  const u = urunTipi.toLowerCase();
  if (u.includes("espresso") || u.includes("kahve") || u.includes("blender") || u.includes("degirmen") || u.includes("bar-mikser") || u.includes("meyve-sikacagi") || u.includes("filter-coffee")) {
    return "A";
  }
  if (t.includes("firin") || t.includes("ocak") || t.includes("izgara") || t.includes("fritoz") || t.includes("benmari") || t.includes("tencere") || t.includes("davlumbaz") || t.includes("salamander")) {
    if (u.includes("pizza") || u.includes("pide")) return "F";
    if (u.includes("pasta") || u.includes("raf-firin") || u.includes("patisserie")) return "D";
    return "B";
  }
  if (t.includes("tezgah") || t.includes("evye") || t.includes("mikser") || t.includes("hamur") || t.includes("kiyma") || t.includes("testere") || t.includes("dilimleme") || t.includes("vakum")) {
    if (u.includes("sogutma") || u.includes("sogutmali") || u.includes("saladette") || u.includes("prep")) return "E";
    return "C";
  }
  if (t.includes("buzdolab") || t.includes("dondurucu") || t.includes("sogutucu") || t.includes("sarap") || t.includes("buz_mak")) {
    return "G";
  }
  if (t.includes("bulasik") || t.includes("yikama") || t.includes("giyotin") || t.includes("siyirma") || t.includes("cikis_tez")) {
    return "H";
  }
  if (u.includes("nakliye") || u.includes("montaj")) {
    return "X";
  }
  return "B";
}

function makeAdminRow(product: any): AdminUrunRow {
  return {
    id: product.id,
    equsto_kod: product.equstoKod,
    marka_kodu: product.modelCode,
    urun_kodu: product.urunKodu || null,
    ad: product.name,
    sku: product.sku,
    tip_kodu: product.pfosUrunTipi,
    kategori: product.category.slug,
    kategori_ad: product.category.name,
    marka_id: product.brandId,
    marka_ad: product.brand.name,
    model: product.modelCode,
    stok: product.stok,
    fiyat_tl: Number(product.priceListTl || 0),
    el_guc: null,
    gaz_guc: null,
    aciklama: product.description,
    detay: product.detayliAciklama,
    gorsel_url: null,
    durum: product.status === "PUBLISHED" ? "aktif" : "pasif",
    proje_fab_aktif: product.pfosAktif,
  };
}

async function main() {
  console.log("[sync-pfos-urun-tipi] Loading database products...");
  const products = await db.product.findMany({
    include: {
      category: true,
      brand: true,
    },
  });
  console.log(`[sync-pfos-urun-tipi] Loaded ${products.length} products. Matching...`);

  // Get all unique tip_kodu values from URUN_TIPI_ALIASES
  const tipKodus = Array.from(new Set(Object.values(URUN_TIPI_ALIASES)));

  let matchedCount = 0;
  for (const product of products) {
    const row = makeAdminRow(product);
    let matchedTip: string | null = null;

    for (const tipKodu of tipKodus) {
      if (productMatchesTipKodu(row, tipKodu)) {
        matchedTip = tipKodu;
        break;
      }
    }

    if (matchedTip) {
      const pfosUrunTipi = getBestAlias(matchedTip, product.name);
      const pfosKategoriKodu = getKategoriKodu(matchedTip, pfosUrunTipi);

      await db.product.update({
        where: { id: product.id },
        data: {
          pfosUrunTipi,
          pfosKategoriKodu,
        },
      });
      matchedCount++;
    }
  }

  console.log(`[sync-pfos-urun-tipi] Completed! Successfully matched and updated ${matchedCount} / ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error("[sync-pfos-urun-tipi] Error:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
