import { db } from "@/lib/db";

const MIN_MS = 2_000;
const MAX_MS = 30 * 60_000; // 30 dk üstünü kıs

export type ProductDwellInput = {
  sessionId: string;
  path: string;
  slug: string;
  productId?: string | null;
  dept?: string;
  title?: string;
  brand?: string;
  durationMs: number;
  locale?: string;
  memberId?: string | null;
  referrer?: string;
};

export function clampDurationMs(raw: number): number | null {
  const n = Math.round(Number(raw) || 0);
  if (n < MIN_MS) return null;
  return Math.min(n, MAX_MS);
}

export async function recordProductPageView(input: ProductDwellInput) {
  const durationMs = clampDurationMs(input.durationMs);
  if (durationMs == null) return { skipped: true as const, reason: "too_short" };

  const sessionId = String(input.sessionId || "").trim().slice(0, 64);
  const slug = String(input.slug || "").trim().slice(0, 200);
  if (!sessionId || !slug) return { skipped: true as const, reason: "invalid" };

  await db.productPageView.create({
    data: {
      sessionId,
      path: String(input.path || "").trim().slice(0, 500) || `/shop/${input.dept || ""}/${slug}`,
      productId: input.productId ? String(input.productId).slice(0, 80) : null,
      slug,
      dept: String(input.dept || "").trim().slice(0, 64),
      title: String(input.title || "").trim().slice(0, 200),
      brand: String(input.brand || "").trim().slice(0, 80),
      durationMs,
      locale: String(input.locale || "tr").slice(0, 8),
      memberId: input.memberId ? String(input.memberId).slice(0, 64) : null,
      referrer: String(input.referrer || "").trim().slice(0, 500),
    },
  });

  return { skipped: false as const };
}

function fmtSec(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m} dk ${rem} sn` : `${m} dk`;
}

export type KullaniciRaporUrun = {
  slug: string;
  productId: string | null;
  title: string;
  brand: string;
  dept: string;
  views: number;
  uniqueSessions: number;
  totalMs: number;
  avgMs: number;
  avgLabel: string;
  totalLabel: string;
};

export type KullaniciRaporRecent = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  dept: string;
  durationMs: number;
  durationLabel: string;
  sessionId: string;
  memberId: string | null;
  path: string;
  createdAt: string;
};

export type KullaniciRaporOzet = {
  days: number;
  views: number;
  uniqueSessions: number;
  uniqueProducts: number;
  avgMs: number;
  avgLabel: string;
  totalMs: number;
  totalLabel: string;
  topByTime: KullaniciRaporUrun[];
  topByViews: KullaniciRaporUrun[];
  recent: KullaniciRaporRecent[];
};

export async function computeKullaniciRaporu(
  days = 30,
  limit = 30,
): Promise<KullaniciRaporOzet> {
  const d = Math.min(Math.max(Number(days) || 30, 1), 365);
  const lim = Math.min(Math.max(Number(limit) || 30, 5), 100);
  const since = new Date(Date.now() - d * 86400000);

  const rows = await db.productPageView.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 20_000,
    select: {
      id: true,
      sessionId: true,
      slug: true,
      productId: true,
      title: true,
      brand: true,
      dept: true,
      path: true,
      durationMs: true,
      memberId: true,
      createdAt: true,
    },
  });

  const bySlug = new Map<
    string,
    {
      slug: string;
      productId: string | null;
      title: string;
      brand: string;
      dept: string;
      views: number;
      sessions: Set<string>;
      totalMs: number;
    }
  >();

  const sessions = new Set<string>();
  let totalMs = 0;

  for (const r of rows) {
    sessions.add(r.sessionId);
    totalMs += r.durationMs;
    const prev = bySlug.get(r.slug);
    if (prev) {
      prev.views += 1;
      prev.sessions.add(r.sessionId);
      prev.totalMs += r.durationMs;
      if (!prev.title && r.title) prev.title = r.title;
      if (!prev.brand && r.brand) prev.brand = r.brand;
      if (!prev.productId && r.productId) prev.productId = r.productId;
    } else {
      bySlug.set(r.slug, {
        slug: r.slug,
        productId: r.productId,
        title: r.title || r.slug,
        brand: r.brand || "",
        dept: r.dept || "",
        views: 1,
        sessions: new Set([r.sessionId]),
        totalMs: r.durationMs,
      });
    }
  }

  const products: KullaniciRaporUrun[] = [...bySlug.values()].map((p) => {
    const avgMs = Math.round(p.totalMs / Math.max(p.views, 1));
    return {
      slug: p.slug,
      productId: p.productId,
      title: p.title,
      brand: p.brand,
      dept: p.dept,
      views: p.views,
      uniqueSessions: p.sessions.size,
      totalMs: p.totalMs,
      avgMs,
      avgLabel: fmtSec(avgMs),
      totalLabel: fmtSec(p.totalMs),
    };
  });

  const topByTime = [...products].sort((a, b) => b.totalMs - a.totalMs).slice(0, lim);
  const topByViews = [...products].sort((a, b) => b.views - a.views).slice(0, lim);

  const recent: KullaniciRaporRecent[] = rows.slice(0, 40).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title || r.slug,
    brand: r.brand || "",
    dept: r.dept || "",
    durationMs: r.durationMs,
    durationLabel: fmtSec(r.durationMs),
    sessionId: r.sessionId.slice(0, 8) + "…",
    memberId: r.memberId,
    path: r.path,
    createdAt: r.createdAt.toISOString(),
  }));

  const avgMs = rows.length ? Math.round(totalMs / rows.length) : 0;

  return {
    days: d,
    views: rows.length,
    uniqueSessions: sessions.size,
    uniqueProducts: bySlug.size,
    avgMs,
    avgLabel: fmtSec(avgMs),
    totalMs,
    totalLabel: fmtSec(totalMs),
    topByTime,
    topByViews,
    recent,
  };
}
