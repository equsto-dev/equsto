import type { EslesmisUrun } from "../schemas/pfos.schema";
import { enrichEslesmisFromKatalogRow } from "./catalog-enrich";
import {
  loadZoneCatalog,
  type ZoneCatalogProduct,
} from "./zone-catalog-loader";
import { matchShopCatalog } from "./shop-catalog-match";
import { normalizeTipKodu, resolveTipKodu, URUN_TIPI_ALIASES } from "./tip-kodu";
import {
  buildOzelImalatEslesmis,
} from "./ozel-imalat-build";
import {
  displayIsimFromSablon,
  isOzelImalatMotor,
} from "./ozel-imalat";
import { matchCatalogByIsimOlcu } from "../referans/referans-eslestirme";
import { isBulasikPfosKalem } from "./bulasik-marka";
import { matchBulasikByReferans } from "../referans/bulasik-match";

export { URUN_TIPI_ALIASES, normalizeTipKodu, resolveTipKodu };

let tipKoduIndex: Map<string, ZoneCatalogProduct> | null = null;

async function getTipKoduIndex(): Promise<Map<string, ZoneCatalogProduct>> {
  if (tipKoduIndex) return tipKoduIndex;
  const bundle = await loadZoneCatalog();
  tipKoduIndex = new Map();
  for (const block of Object.values(bundle.catalog)) {
    for (const product of block.products ?? []) {
      if (!product.tip_kodu) continue;
      const key = normalizeTipKodu(product.tip_kodu);
      if (!tipKoduIndex.has(key)) tipKoduIndex.set(key, product);
    }
  }
  return tipKoduIndex;
}

function catalogProductToEslesmis(p: ZoneCatalogProduct): EslesmisUrun {
  const fiyat = Math.round(Number(p.unit_price_try) || 0);
  const pseudoRow = {
    id: `catalog-${p.id}`,
    ad: p.name,
    sku: p.tip_kodu || p.id,
    tip_kodu: p.tip_kodu || null,
    kategori: "",
    kategori_ad: "",
    marka_id: null,
    marka_ad: p.marka || "—",
    model: p.dimensions ?? null,
    stok: 0,
    fiyat_tl: fiyat,
    el_guc: null,
    gaz_guc: null,
    aciklama: null,
    gorsel_url: null,
    durum: "aktif" as const,
    proje_fab_aktif: true,
  };
  const enriched = enrichEslesmisFromKatalogRow(pseudoRow, {
    zoneMarka: p.marka,
    zoneOlcu: p.dimensions,
    sablonIsim: p.name,
  });
  return {
    id: pseudoRow.id,
    sku: pseudoRow.sku,
    ad: p.name,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw:
      p.elk_kw != null && Number.isFinite(Number(p.elk_kw))
        ? Number(p.elk_kw)
        : null,
    gazGucuKw:
      p.gaz_kw != null && Number.isFinite(Number(p.gaz_kw))
        ? Number(p.gaz_kw)
        : null,
    fiyat: Math.round(Number(p.unit_price_try) || 0),
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: null,
  };
}

async function matchZoneCatalog(urunTipi: string): Promise<EslesmisUrun | null> {
  const index = await getTipKoduIndex();
  const tip = resolveTipKodu(urunTipi);
  const candidates = [
    tip,
    urunTipi,
    normalizeTipKodu(urunTipi),
    URUN_TIPI_ALIASES[urunTipi],
  ].filter(Boolean);

  for (const key of candidates) {
    const product = index.get(normalizeTipKodu(String(key)));
    if (product && Number(product.unit_price_try) > 0) {
      return catalogProductToEslesmis(product);
    }
  }
  return null;
}

/**
 * DB eşleşmesi yoksa: önce e-ticaret (ekipmanlar.json), sonra zone katalog statik fiyat.
 */
export async function matchCatalogFallback(
  urunTipi: string,
  fiyatStratejisi: "ekonomik" | "orta" | "premium" = "ekonomik",
  sablonIsim?: string | null,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  if (
    isBulasikPfosKalem({ isim: sablonIsim, urunTipi }) &&
    sablonIsim?.trim()
  ) {
    const bulasik = await matchBulasikByReferans(
      sablonIsim,
      notlar,
      fiyatStratejisi,
    );
    if (bulasik) return bulasik;
  }

  const shop = await matchShopCatalog(urunTipi, fiyatStratejisi);
  if (shop) return shop;
  if (sablonIsim?.trim()) {
    const bySablon = await matchCatalogByIsimOlcu(
      sablonIsim,
      notlar,
      urunTipi,
      fiyatStratejisi,
    );
    if (bySablon) return bySablon;
  }
  if (isOzelImalatMotor({ sablonIsim, urunTipi })) return null;
  return matchZoneCatalog(urunTipi);
}

/** Portashelf / özel imalat — önce sitedeki katalog fiyatı, yoksa boş */
export async function matchOzelImalatForSablon(
  isim: string,
  urunTipi: string,
  notlar?: string | null,
): Promise<EslesmisUrun> {
  const shop = await matchShopCatalog(urunTipi, "ekonomik");
  if (shop) return shop;

  const bySablon = await matchCatalogByIsimOlcu(isim, notlar, urunTipi, "ekonomik");
  if (bySablon) return bySablon;

  return buildOzelImalatEslesmis({
    isim: displayIsimFromSablon(isim) || isim,
    urunTipi,
    notlar,
    fiyatTry: 0,
    fiyatEur: null,
  });
}
