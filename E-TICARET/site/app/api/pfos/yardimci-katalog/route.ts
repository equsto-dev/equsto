import { NextResponse } from "next/server";
import { matchShopCatalog } from "@/lib/pfos/core/shop-catalog-match";
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
};

function kartFromUrun(
  label: string,
  tipKodu: string | null,
  urun: EslesmisUrun | null,
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
  };
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
  const labels = yardimciEkipmanForProje({
    dukkanTuru: dukkan,
    ustSegment: segment,
    konseptLabel,
    mevcutTipKodlari: mevcutTips,
    eksikZorunluTipKodlari: eksikTips,
    m2,
    limit: limit > 0 ? limit + 6 : 14,
  });
  const items: YardimciKatalogKart[] = [];

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
    items.push(kart);
    if (limit > 0 && items.length >= limit) break;
  }

  return NextResponse.json({ items });
}
