import { NextResponse } from "next/server";
import { getMemberIdByToken } from "@/lib/member-auth";
import { normalizeTipKodu } from "@/lib/pfos/core/tip-kodu";
import {
  browseTipKodlari,
  listMemberBrowseForOneri,
} from "@/lib/pfos/member-browse-log";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";
import {
  matchYardimciRailUrun,
  slugRailUrun,
} from "@/lib/pfos/wizard/yardimci-katalog-match";
import {
  yardimciEkipmanForProje,
  yardimciKonseptTipSet,
} from "@/lib/pfos/wizard/yardimci-ekipman";
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
): YardimciKatalogKart | null {
  if (!urun || !urun.gorselUrl) return null;
  const slug = String(urun.slug || urun.id || "").replace(/^ecom_/, "");
  if (!slug || slug.startsWith("pfos-link-")) return null;
  return {
    label,
    tipKodu,
    id: urun.id,
    ad: urun.ad,
    marka: urun.marka,
    fiyat: urun.fiyat > 0 ? urun.fiyat : null,
    doviz: urun.doviz,
    gorselUrl: urun.gorselUrl,
    href: `/urun/${encodeURIComponent(slug)}`,
    memberBrowse: extra?.memberBrowse,
  };
}

function kartKey(kart: YardimciKatalogKart): string {
  return kart.id ?? kart.href ?? kart.label;
}

function tipKonseptIci(tip: string | null | undefined, izinli: Set<string>): boolean {
  if (!tip) return false;
  return izinli.has(normalizeTipKodu(tip));
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

  const projeGirdi = {
    dukkanTuru: dukkan,
    ustSegment: segment,
    konseptLabel,
    mevcutTipKodlari: mevcutTips,
    eksikZorunluTipKodlari: eksikTips,
    m2,
  };
  const konseptTips = yardimciKonseptTipSet(projeGirdi);
  const mevcutNorm = new Set(mevcutTips.map((t) => normalizeTipKodu(t)));
  const items: YardimciKatalogKart[] = [];
  const seen = new Set<string>();

  let gezilenTipKodlari: string[] = [];
  const token = readBearerToken(req);
  if (token) {
    const memberId = await getMemberIdByToken(token);
    if (memberId) {
      const browses = await listMemberBrowseForOneri(
        memberId,
        { konseptLabel, dukkanTuru: dukkan },
        limit > 0 ? Math.min(limit + 4, 12) : 10,
      );
      gezilenTipKodlari = [...browseTipKodlari(browses)].filter((t) =>
        konseptTips.has(t),
      );

      const browseCap = limit > 0 ? Math.min(2, limit) : 2;
      for (const browse of browses
        .filter((b) => tipKonseptIci(b.tipKodu, konseptTips))
        .slice(0, browseCap)) {
        const urun = await slugRailUrun(browse.slug);
        if (!urun) continue;
        const kart = kartFromUrun(urun.ad ?? browse.slug, browse.tipKodu, urun, {
          memberBrowse: true,
        });
        if (!kart) continue;
        const tipNorm = kart.tipKodu ? normalizeTipKodu(kart.tipKodu) : "";
        if (tipNorm && mevcutNorm.has(tipNorm)) continue;
        const key = kartKey(kart);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(kart);
      }
    }
  }

  const labels = yardimciEkipmanForProje({
    ...projeGirdi,
    gezilenTipKodlari,
    limit: limit > 0 ? limit + 8 : 14,
  });

  for (const label of labels) {
    const tipKodu = yardimciLabelToTip(label);
    if (tipKodu && !tipKonseptIci(tipKodu, konseptTips)) continue;
    let kart: YardimciKatalogKart | null = null;
    if (tipKodu) {
      const urun = await matchYardimciRailUrun(tipKodu);
      kart = kartFromUrun(label, tipKodu, urun);
    }
    if (matchedOnly && !kart) continue;
    if (!kart) continue;
    const key = kartKey(kart);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(kart);
    if (limit > 0 && items.length >= limit) break;
  }

  return NextResponse.json({ items: limit > 0 ? items.slice(0, limit) : items });
}
