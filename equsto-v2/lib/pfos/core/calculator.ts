/**
 * PFOS Calculator — Downloads index.ts, repo Product şemasına uyarlandı
 *
 * Product: pfosUrunTipi, pfosKategoriKodu, priceListTl (TRY), pfosAktif
 */

import type { PfosKategoriKodu } from "@/lib/prisma";
import { db } from "@/lib/db";
import { calcAdet } from "./engine-types";
import type { ConceptTemplate, RuleItem } from "./engine-types";
import type {
  PFOSRequest,
  PFOSResponse,
  PFOSKalemi,
  EslesmisUrun,
  FiyatStratejisi,
} from "../schemas/pfos.schema";
import { KONSEPT_LABELS } from "../schemas/pfos.schema";

function buildPozMap(items: RuleItem[]): Map<RuleItem, string> {
  const counters: Record<string, number> = {};
  const map = new Map<RuleItem, string>();
  for (const item of items) {
    const cat = item.kategoriKodu;
    counters[cat] = (counters[cat] ?? 0) + 1;
    map.set(item, `${cat}${String(counters[cat]).padStart(2, "0")}`);
  }
  return map;
}

function mapDoviz(currency: string | null | undefined): "EUR" | "TRY" | "USD" {
  const c = String(currency || "TRY").toUpperCase();
  if (c === "EUR" || c === "USD") return c;
  return "TRY";
}

async function matchProduct(
  urunTipi: string,
  kategoriKodu: string,
  fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const orderBy =
    fiyatStratejisi === "premium"
      ? ({ priceListTl: "desc" } as const)
      : ({ priceListTl: "asc" } as const);

  const product = await db.product.findFirst({
    where: {
      pfosUrunTipi: urunTipi,
      pfosKategoriKodu: kategoriKodu as PfosKategoriKodu,
      pfosAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
    },
    include: {
      brand: true,
      images: { where: { isPrimary: true }, take: 1, orderBy: { order: "asc" } },
    },
    orderBy,
  });

  if (!product) {
    const fallback = await db.product.findFirst({
      where: {
        pfosUrunTipi: urunTipi,
        pfosAktif: true,
        status: "PUBLISHED",
        priceListTl: { gt: 0 },
      },
      include: {
        brand: true,
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy,
    });
    if (!fallback) return null;
    return productToEslesmis(fallback);
  }

  return productToEslesmis(product);
}

function dec(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function productToEslesmis(product: {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  model: string | null;
  elektrikGucuKw: unknown;
  gazGucuKw: unknown;
  priceListTl: unknown;
  priceCurrency: string;
  dovizListe?: string | null;
  brand: { name: string };
  images: { url: string }[];
}): EslesmisUrun {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    ad: product.name,
    marka: product.brand.name,
    model: product.model,
    elektrikGucuKw: dec(product.elektrikGucuKw),
    gazGucuKw: dec(product.gazGucuKw),
    fiyat: dec(product.priceListTl) ?? 0,
    doviz: mapDoviz(product.priceCurrency || product.dovizListe),
    gorselUrl: product.images[0]?.url ?? null,
  };
}

export async function calculateQuote(
  req: PFOSRequest,
  template: ConceptTemplate,
): Promise<PFOSResponse> {
  const { m2, konsept, sehir } = req;
  const fiyatStratejisi: FiyatStratejisi = req.fiyatStratejisi ?? "orta";

  const eligibleItems = template.items.filter((item) => {
    if (item.minM2 !== undefined && m2 < item.minM2) return false;
    if (item.maxM2 !== undefined && m2 >= item.maxM2) return false;
    return true;
  });

  const pozMap = buildPozMap(eligibleItems);

  const kalemler: PFOSKalemi[] = await Promise.all(
    eligibleItems.map(async (item) => {
      const adet = calcAdet(item.scale, m2, template.seatDensity);
      const urun = await matchProduct(
        item.urunTipi,
        item.kategoriKodu,
        fiyatStratejisi,
      );

      return {
        poz: pozMap.get(item)!,
        kategoriKodu: item.kategoriKodu,
        altKategori: item.altKategori,
        urunTipi: item.urunTipi,
        isim: item.isim,
        tip: item.tip,
        opsiyonelSebep: item.opsiyonelSebep,
        adet,
        elektrikGucuKwHint: item.elektrikGucuKwHint,
        gazGucuKwHint: item.gazGucuKwHint,
        notlar: item.notlar,
        urun,
      };
    }),
  );

  const zorunluKalemler = kalemler.filter((k) => k.tip === "zorunlu");
  const eslesmisZorunlu = zorunluKalemler.filter((k) => k.urun !== null);
  const eslesmeToplam = kalemler.filter((k) => k.urun !== null).length;

  const toplamElektrikKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.elektrikGucuKw ?? k.elektrikGucuKwHint ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const toplamGazKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.gazGucuKw ?? k.gazGucuKwHint ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const eksikZorunlu = zorunluKalemler.filter((k) => k.urun === null);
  const toplamFiyat =
    eksikZorunlu.length === 0
      ? kalemler.reduce((sum, k) => {
          if (!k.urun) return sum;
          return sum + k.urun.fiyat * k.adet;
        }, 0)
      : null;

  const doviz: "EUR" | "TRY" | "USD" = "TRY";

  const guvenSkoru =
    zorunluKalemler.length > 0
      ? Math.round((eslesmisZorunlu.length / zorunluKalemler.length) * 0.8 * 100) /
        100
      : 0.8;

  const uyarilar: string[] = [];

  if (eksikZorunlu.length > 0) {
    uyarilar.push(
      `${eksikZorunlu.length} zorunlu kalem için ürün kataloğunda eşleşme bulunamadı: ` +
        eksikZorunlu.map((k) => k.isim).join(", "),
    );
  }

  if (guvenSkoru < 0.5) {
    uyarilar.push(
      "Güven skoru düşük — ürün kataloğunun bu konsept için genişletilmesi önerilir.",
    );
  }

  uyarilar.push(
    "PFOS yapay zekadan yardım alır; hata yapabilir. Teklif öncesi uzmanla doğrulayınız.",
  );

  return {
    konsept,
    konseptLabel: KONSEPT_LABELS[konsept] ?? template.label,
    m2,
    sehir,
    guvenSkoru,
    kalemler,
    ozet: {
      toplamElektrikKw: Math.round(toplamElektrikKw * 10) / 10,
      toplamGazKw: Math.round(toplamGazKw * 10) / 10,
      toplamFiyat: toplamFiyat != null ? Math.round(toplamFiyat) : null,
      doviz,
      eslesmeSayisi: eslesmeToplam,
      toplamKalemSayisi: kalemler.length,
      zorunluKalemSayisi: zorunluKalemler.length,
      eslesmisZorunluSayisi: eslesmisZorunlu.length,
    },
    uyarilar,
  };
}
