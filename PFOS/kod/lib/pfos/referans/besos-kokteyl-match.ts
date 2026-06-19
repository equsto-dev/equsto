import { loadBesosCatalogue } from "@/lib/besos/load-data";
import { vitrumModuleSlug } from "@/lib/besos/module-url";
import type { BesosProduct } from "@/lib/besos/types";
import {
  besosNetEurFromProduct,
  besosProductOlcuCm,
  isKokteylIstasyonReferansIsim,
  pickClosestBesosBarProduct,
} from "../core/besos-bar-spec";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { normalizePfosGorselUrl } from "../core/katalog-gorsel-url";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

export const BESOS_BAR_MARKA = "Besos";

export { isKokteylIstasyonReferansIsim };

let catalogueCache: BesosProduct[] | null = null;

async function loadBesosBarProducts(): Promise<BesosProduct[]> {
  if (catalogueCache) return catalogueCache;
  const cat = await loadBesosCatalogue();
  catalogueCache = cat.products ?? [];
  return catalogueCache;
}

function besosProductToEslesmis(
  product: BesosProduct,
  referansIsim: string,
  olcuDisplay: string | null,
): EslesmisUrun {
  const slug = vitrumModuleSlug(product);
  const netEur = besosNetEurFromProduct(product);
  const dims = besosProductOlcuCm(product);
  const olcu =
    olcuDisplay ??
    (dims ? `${dims[0]}*${dims[1]}*${dims[2]}` : null);
  const img = product.imageLocal ?? product.image ?? null;

  return {
    id: `besos-${slug || product.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    slug,
    sku: product.code,
    ad: displayIsimFromSablon(referansIsim),
    marka: BESOS_BAR_MARKA,
    model: product.name !== "Bar Module" ? product.name : product.code,
    olcu: toOlcuMmDisplay(olcu ?? "") ?? olcu,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: netEur,
    doviz: "EUR",
    gorselUrl: normalizePfosGorselUrl(img),
    teklifAciklama: product.description ?? null,
  };
}

/** Kokteyl istasyonu — /besos vitrum-bars-catalogue, en yakın 70×85 modül genişliği */
export async function matchBesosKokteylIstasyonByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  _urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (!isKokteylIstasyonReferansIsim(isim)) return null;

  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  if (!olcu) return null;

  const products = await loadBesosBarProducts();
  const picked = pickClosestBesosBarProduct(products, olcu, isim);
  if (!picked) return null;

  const olcuDisplay = toOlcuMmDisplay(olcu) ?? olcu;
  return besosProductToEslesmis(picked, isim, olcuDisplay);
}
