import { db } from "@/lib/db";
import type { ShopCartLine } from "@/lib/shop-cart";

type PairCount = { a: string; b: string; count: number };
type BrandCatSum = { marka: string; kategori: string; adet: number; tutar: number };

function lineKey(it: ShopCartLine): string {
  const b = String(it.b ?? "").trim();
  const c = String(it.c ?? "").trim();
  const n = String(it.n ?? "").trim();
  return [b, c, n].filter(Boolean).join(" · ") || n || b || "—";
}

function parsePrice(p: unknown): number {
  const s = String(p ?? "").trim();
  const num = Number(s.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}

function bumpPair(map: Map<string, number>, a: string, b: string) {
  const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function computeCartCoOccurrence(limit = 20): Promise<PairCount[]> {
  const carts = await db.shopCart.findMany({
    select: { items: true },
    take: 5000,
    orderBy: { updatedAt: "desc" },
  });

  const map = new Map<string, number>();
  for (const cart of carts) {
    const raw = cart.items;
    if (!Array.isArray(raw)) continue;
    const lines = raw.filter((x) => x && typeof x === "object") as ShopCartLine[];
    if (lines.length < 2) continue;
    const keys = [...new Set(lines.map(lineKey).filter((k) => k !== "—"))].sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        bumpPair(map, keys[i], keys[j]);
      }
    }
  }

  return [...map.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split("|||");
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, limit);
}

type Kalem = {
  marka?: string;
  kategori?: string;
  ad?: string;
  adet?: number;
  birim_fiyat_tl?: number;
  ara_toplam_tl?: number;
};

function brandCatFromKalem(k: Kalem): BrandCatSum {
  const adet = Number(k.adet ?? 1) || 1;
  const tutar =
    Number(k.ara_toplam_tl ?? 0) ||
    (Number(k.birim_fiyat_tl ?? 0) || 0) * adet;
  return {
    marka: String(k.marka ?? "—").trim() || "—",
    kategori: String(k.kategori ?? "—").trim() || "—",
    adet,
    tutar,
  };
}

export async function computeBrandCategorySales(limit = 30): Promise<BrandCatSum[]> {
  const map = new Map<string, BrandCatSum>();

  const siparisler = await db.siparis.findMany({
    select: { kalemler: true },
    take: 2000,
    orderBy: { createdAt: "desc" },
  });

  for (const s of siparisler) {
    const kalemler = Array.isArray(s.kalemler) ? (s.kalemler as Kalem[]) : [];
    for (const k of kalemler) {
      const row = brandCatFromKalem(k);
      const key = `${row.marka}\t${row.kategori}`;
      const prev = map.get(key);
      if (prev) {
        prev.adet += row.adet;
        prev.tutar += row.tutar;
      } else {
        map.set(key, { ...row });
      }
    }
  }

  const carts = await db.shopCart.findMany({
    select: { items: true },
    take: 3000,
    orderBy: { updatedAt: "desc" },
  });

  for (const cart of carts) {
    const raw = cart.items;
    if (!Array.isArray(raw)) continue;
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as ShopCartLine;
      const adet = Number(o.q ?? 1) || 1;
      const tutar = parsePrice(o.p) * adet;
      const key = `${String(o.b ?? "—")}\t${String(o.c ?? "—")}`;
      const prev = map.get(key);
      if (prev) {
        prev.adet += adet;
        prev.tutar += tutar;
      } else {
        map.set(key, {
          marka: String(o.b ?? "—").trim() || "—",
          kategori: String(o.c ?? "—").trim() || "—",
          adet,
          tutar,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.tutar - a.tutar).slice(0, limit);
}

export async function topSearchQueries(limit = 30, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await db.searchQueryLog.groupBy({
    by: ["query"],
    where: { createdAt: { gte: since } },
    _count: { query: true },
    _sum: { hitCount: true },
    orderBy: { _count: { query: "desc" } },
    take: limit,
  });

  return rows.map((r) => ({
    query: r.query,
    count: r._count.query,
    avg_hits: r._sum.hitCount != null ? Math.round(r._sum.hitCount / r._count.query) : 0,
  }));
}

export async function siparisOzet() {
  const [toplam, beklemede, hazirlaniyor, kargoda, teslim, iptal] = await Promise.all([
    db.siparis.count(),
    db.siparis.count({ where: { durum: "beklemede" } }),
    db.siparis.count({ where: { durum: "hazirlaniyor" } }),
    db.siparis.count({ where: { durum: "kargoda" } }),
    db.siparis.count({ where: { durum: "teslim" } }),
    db.siparis.count({ where: { durum: "iptal" } }),
  ]);

  const agg = await db.siparis.aggregate({
    _sum: { toplamTl: true },
    where: { durum: { not: "iptal" } },
  });

  return {
    toplam,
    durum: { beklemede, hazirlaniyor, kargoda, teslim, iptal },
    ciro_tl: Number(agg._sum.toplamTl ?? 0),
  };
}

export async function teklifOzet() {
  const toplam = await db.teklif.count();
  const onaylandi = await db.teklif.count({ where: { durum: "onaylandi" } });
  const gonderildi = await db.teklif.count({ where: { durum: "gonderildi" } });
  return { toplam, onaylandi, gonderildi };
}
