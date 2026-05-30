/** Marka çeşitlendirmeli birleştirme — döngüsel import yok. */
export type DiverseSearchHit = {
  id: string;
  brand?: string;
};

function brandKey(hit: DiverseSearchHit): string {
  const b = String(hit.brand || "")
    .toLocaleLowerCase("tr")
    .trim();
  if (!b) return "_";
  return b.split(/\s+/)[0] || b;
}

export function mergeSearchHitsDiverse<T extends DiverseSearchHit>(
  primary: T[],
  secondary: T[],
  limit: number,
): T[] {
  const queues = new Map<string, T[]>();
  const seen = new Set<string>();

  function enqueue(list: T[]) {
    for (const h of list) {
      if (!h?.id || seen.has(h.id)) continue;
      seen.add(h.id);
      const k = brandKey(h);
      if (!queues.has(k)) queues.set(k, []);
      queues.get(k)!.push(h);
    }
  }

  enqueue(primary);
  enqueue(secondary);

  const brands = [...queues.keys()];
  const out: T[] = [];
  while (out.length < limit && brands.some((b) => (queues.get(b)?.length || 0) > 0)) {
    for (const b of brands) {
      const q = queues.get(b);
      if (!q?.length) continue;
      out.push(q.shift()!);
      if (out.length >= limit) break;
    }
  }
  return out;
}
