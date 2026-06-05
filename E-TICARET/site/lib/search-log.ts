import { db } from "@/lib/db";

/** Arama sorgusunu arka planda kaydet (hata yutulur). */
export function logSearchQuery(query: string, hitCount: number, source?: string) {
  const q = query.trim().slice(0, 200);
  if (!q || q.length < 2) return;
  void db.searchQueryLog
    .create({
      data: {
        query: q.toLowerCase(),
        hitCount: Math.max(0, hitCount | 0),
        source: source || "meili",
      },
    })
    .catch(() => {});
}
