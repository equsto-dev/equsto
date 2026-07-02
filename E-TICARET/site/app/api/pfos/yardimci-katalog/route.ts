import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMemberIdByToken } from "@/lib/member-auth";
import { matchShopCatalog } from "@/lib/pfos/core/shop-catalog-match";
import { normalizeTipKodu } from "@/lib/pfos/core/tip-kodu";
import {
  browseTipKodlari,
  listMemberBrowseForOneri,
} from "@/lib/pfos/member-browse-log";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";
import { yardimciEkipmanForProje } from "@/lib/pfos/wizard/yardimci-ekipman";
import { yardimciLabelToTip } from "@/lib/pfos/wizard/yardimci-label-tip";

export type YardimciKatalogKart = {
  label: string;
  tipKodu: string | null;
  id: string | null;
  ad: string | null;
  marka: string | null;
  fiyat: number | null;
  doviz: string | null;
  gorselUrl: string | null;
  href: string | null;
  /** Faz C — üyenin gezdiği ürün */
  memberBrowse?: boolean;
};

function readBearerToken(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const alt = req.headers.get("x-equsto-authorization");
  if (alt) return alt.trim();
  return "";
}

function kartFromUrun(
  label: string,
  tipKodu: string | null,
  urun: EslesmisUrun | null,
  extra?: { memberBrowse?: boolean },
): YardimciKatalogKart {
  if (!urun) {
    return {
      label,
      tipKodu,
      id: null,
      ad: null,
      marka: null,
      fiyat: null,
      doviz: null,
      gorselUrl: null,
      href: null,
      memberBrowse: extra?.memberBrowse,
    };
  }
  const slug = String(urun.slug || urun.id || "").replace(/^ecom_/, "");
  return {
    label,
    tipKodu,
    id: urun.id,
    ad: urun.ad,
    marka: urun.marka,
    fiyat: urun.fiyat > 0 ? urun.fiyat : null,
    doviz: urun.doviz,
    gorselUrl: urun.gorselUrl,
    href: slug ? `/urun/${encodeURIComponent(slug)}` : null,
    memberBrowse: extra?.memberBrowse,
  };
}

function mapDoviz(currency: string | null | undefined): "EUR" | "TRY" | "USD" {
  const c = String(currency || "TRY").toUpperCase();
  if (c === "EUR" || c === "USD") return c;
  return "TRY";
}

function dec(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function kartFromSlug(slug: string): Promise<YardimciKatalogKart | null> {
  const clean = slug.replace(/^ecom_/, "").trim();
  if (!clean) return null;
  const product = await db.product.findFirst({
    where: {
      slug: clean,
      ecommerceAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
    },
    include: {
      brand: true,
      images: { where: { isPrimary: true }, take: 1, orderBy: { order: "asc" } },
    },
  });
  if (!product) return null;
  const urun: EslesmisUrun = {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    ad: product.name,
    marka: product.brand.name,
    model: product.model,
    olcu: null,
    elektrikGucuKw: dec(product.elektrikGucuKw),
    gazGucuKw: dec(product.gazGucuKw),
    fiyat: dec(product.priceListTl) ?? 0,
    doviz: mapDoviz(product.priceCurrency),
    gorselUrl: product.images[0]?.url ?? null,
  };
  return kartFromUrun(product.name, product.pfosUrunTipi, urun, {
    memberBrowse: true,
  });
}

function kartKey(kart: YardimciKatalogKart): string {
  return kart.id ?? kart.href ?? kart.label;
}

/** GET /api/pfos/yardimci-katalog?dukkan=…&segment=…&limit=5&matched=1 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dukkan = url.searchParams.get("dukkan")?.trim() ?? "";
  const segment = url.searchParams.get("segment")?.trim() ?? "";
  const konseptLabel = url.searchParams.get("konseptLabel")?.trim() ?? "";
  const mevcutTips = (url.searchParams.get("tips") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const eksikTips = (url.searchParams.get("eksik") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const m2Raw = parseInt(url.searchParams.get("m2") ?? "0", 10);
  const m2 = m2Raw > 0 ? m2Raw : undefined;
  const matchedOnly = url.searchParams.get("matched") === "1";
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "0", 10);
  const limit = limitRaw > 0 ? limitRaw : 0;

  const mevcutNorm = new Set(mevcutTips.map((t) => normalizeTipKodu(t)));

  let gezilenTipKodlari: string[] = [];
  let browseSlugs: string[] = [];
  const token = readBearerToken(req);
  if (token) {
    const memberId = await getMemberIdByToken(token);
    if (memberId) {
      const browses = await listMemberBrowseForOneri(
        memberId,
        { konseptLabel, dukkanTuru: dukkan },
        limit > 0 ? Math.min(limit + 4, 12) : 10,
      );
      gezilenTipKodlari = [...browseTipKodlari(browses)];
      browseSlugs = browses.map((b) => b.slug);
    }
  }

  const labels = yardimciEkipmanForProje({
    dukkanTuru: dukkan,
    ustSegment: segment,
    konseptLabel,
    mevcutTipKodlari: mevcutTips,
    eksikZorunluTipKodlari: eksikTips,
    gezilenTipKodlari,
    m2,
    limit: limit > 0 ? limit + 6 : 14,
  });
  const items: YardimciKatalogKart[] = [];
  const seen = new Set<string>();

  const browseCap = limit > 0 ? Math.min(3, limit) : 3;
  for (const slug of browseSlugs.slice(0, browseCap)) {
    const kart = await kartFromSlug(slug);
    if (!kart || !kart.href) continue;
    const tipNorm = kart.tipKodu ? normalizeTipKodu(kart.tipKodu) : "";
    if (tipNorm && mevcutNorm.has(tipNorm)) continue;
    const key = kartKey(kart);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(kart);
  }

  for (const label of labels) {
    const tipKodu = yardimciLabelToTip(label);
    let kart: YardimciKatalogKart;
    if (!tipKodu) {
      kart = kartFromUrun(label, null, null);
    } else {
      const urun = await matchShopCatalog(tipKodu, "ekonomik");
      kart = kartFromUrun(label, tipKodu, urun);
    }
    if (matchedOnly && !kart.href) continue;
    const key = kartKey(kart);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(kart);
    if (limit > 0 && items.length >= limit) break;
  }

  return NextResponse.json({ items: limit > 0 ? items.slice(0, limit) : items });
}
