import { NextResponse } from "next/server";
import { matchShopCatalog } from "@/lib/pfos/core/shop-catalog-match";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";
import { yardimciEkipmanForKonsept } from "@/lib/pfos/wizard/yardimci-ekipman";
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

/** GET /api/pfos/yardimci-katalog?dukkan=…&segment=… */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dukkan = url.searchParams.get("dukkan")?.trim() ?? "";
  const segment = url.searchParams.get("segment")?.trim() ?? "";
  const labels = yardimciEkipmanForKonsept(dukkan, segment);
  const items: YardimciKatalogKart[] = [];

  for (const label of labels) {
    const tipKodu = yardimciLabelToTip(label);
    if (!tipKodu) {
      items.push(kartFromUrun(label, null, null));
      continue;
    }
    const urun = await matchShopCatalog(tipKodu, "ekonomik");
    items.push(kartFromUrun(label, tipKodu, urun));
  }

  return NextResponse.json({ items });
}
