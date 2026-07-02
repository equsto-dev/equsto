import { db } from "@/lib/db";
import { normalizeTipKodu, resolveTipKodu } from "@/lib/pfos/core/tip-kodu";

export const PFOS_MEMBER_BROWSE_SOURCES = ["pdp", "pfos_rail", "search"] as const;
export type PfosMemberBrowseSource = (typeof PFOS_MEMBER_BROWSE_SOURCES)[number];

export type PfosMemberBrowseInput = {
  memberId: string;
  slug: string;
  productId?: string | null;
  tipKodu?: string | null;
  konseptLabel?: string;
  dukkanTuru?: string;
  source?: PfosMemberBrowseSource;
};

export type MemberBrowseContext = {
  konseptLabel?: string;
  dukkanTuru?: string;
};

export type MemberBrowseOneri = {
  slug: string;
  tipKodu: string | null;
  productId: string | null;
  viewedAt: Date;
};

const DEDUP_MS = 24 * 60 * 60 * 1000;
const BROWSE_LOOKBACK_DAYS = 30;

function normSlug(slug: string): string {
  return String(slug ?? "")
    .trim()
    .replace(/^ecom_/, "")
    .replace(/^\/urun\//, "")
    .split("?")[0];
}

function normContextPart(v: string | undefined): string {
  return String(v ?? "").trim();
}

function browseContextMatches(
  stored: { konseptLabel: string; dukkanTuru: string },
  current: MemberBrowseContext,
): boolean {
  const curKonsept = normContextPart(current.konseptLabel);
  const curDukkan = normContextPart(current.dukkanTuru);
  const stKonsept = normContextPart(stored.konseptLabel);
  const stDukkan = normContextPart(stored.dukkanTuru);

  if (curKonsept && stKonsept && curKonsept.toLowerCase() === stKonsept.toLowerCase()) {
    return true;
  }
  if (curDukkan && stDukkan && curDukkan.toLowerCase() === stDukkan.toLowerCase()) {
    return true;
  }
  if (!stKonsept && !stDukkan) return true;
  return false;
}

async function resolveTipFromSlug(slug: string): Promise<{
  productId: string | null;
  tipKodu: string | null;
}> {
  const clean = normSlug(slug);
  if (!clean) return { productId: null, tipKodu: null };
  const row = await db.product.findFirst({
    where: { slug: clean, ecommerceAktif: true, status: "PUBLISHED" },
    select: { id: true, pfosUrunTipi: true },
  });
  if (!row) return { productId: null, tipKodu: null };
  const tip = row.pfosUrunTipi ? resolveTipKodu(row.pfosUrunTipi) : null;
  return { productId: row.id, tipKodu: tip };
}

/** Üye ürün sayfası tıklaması / görüntülemesi */
export async function recordPfosMemberBrowse(
  input: PfosMemberBrowseInput,
): Promise<{ deduped: boolean }> {
  const memberId = String(input.memberId ?? "").trim();
  const slug = normSlug(input.slug);
  if (!memberId || !slug) return { deduped: false };

  const since = new Date(Date.now() - DEDUP_MS);
  const dup = await db.pfosMemberBrowseEvent.findFirst({
    where: { memberId, slug, createdAt: { gte: since } },
    select: { id: true },
  });
  if (dup) return { deduped: true };

  let productId = input.productId?.trim() || null;
  let tipKodu = input.tipKodu?.trim() || null;
  if (!productId || !tipKodu) {
    const resolved = await resolveTipFromSlug(slug);
    productId = productId || resolved.productId;
    tipKodu = tipKodu || resolved.tipKodu;
  }
  if (tipKodu) tipKodu = resolveTipKodu(tipKodu);

  await db.pfosMemberBrowseEvent.create({
    data: {
      memberId,
      slug,
      productId,
      tipKodu,
      konseptLabel: normContextPart(input.konseptLabel),
      dukkanTuru: normContextPart(input.dukkanTuru),
      source: PFOS_MEMBER_BROWSE_SOURCES.includes(
        input.source as PfosMemberBrowseSource,
      )
        ? (input.source as PfosMemberBrowseSource)
        : "pdp",
    },
  });

  return { deduped: false };
}

/** Konsept bağlamına uygun son gezilen ürünler (slug + tip) */
export async function listMemberBrowseForOneri(
  memberId: string,
  context: MemberBrowseContext,
  limit = 12,
): Promise<MemberBrowseOneri[]> {
  const id = String(memberId ?? "").trim();
  if (!id || limit <= 0) return [];

  const since = new Date(Date.now() - BROWSE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db.pfosMemberBrowseEvent.findMany({
    where: { memberId: id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      slug: true,
      tipKodu: true,
      productId: true,
      konseptLabel: true,
      dukkanTuru: true,
      createdAt: true,
    },
  });

  const seen = new Set<string>();
  const out: MemberBrowseOneri[] = [];

  for (const row of rows) {
    if (!browseContextMatches(row, context)) continue;
    const slug = normSlug(row.slug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const tip = row.tipKodu ? resolveTipKodu(row.tipKodu) : null;
    out.push({
      slug,
      tipKodu: tip,
      productId: row.productId,
      viewedAt: row.createdAt,
    });
    if (out.length >= limit) break;
  }

  return out;
}

export function browseTipKodlari(
  browses: MemberBrowseOneri[],
): Set<string> {
  const tips = new Set<string>();
  for (const b of browses) {
    if (!b.tipKodu) continue;
    tips.add(normalizeTipKodu(b.tipKodu));
  }
  return tips;
}
