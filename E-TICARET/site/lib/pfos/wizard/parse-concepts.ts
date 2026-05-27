import type { KonseptMeta } from "@/lib/pfos/wizard/types";

/** GET /api/pfos/concepts veya legacy sarmalayıcı yanıtları → dizi */
export function parseConceptsResponse(data: unknown): KonseptMeta[] {
  if (Array.isArray(data)) {
    return data as KonseptMeta[];
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.konseptler)) {
      return o.konseptler.map((k) => {
        const row = k as Record<string, unknown>;
        return {
          konsept: String(row.slug ?? row.konsept ?? ""),
          label: String(row.label ?? row.konsept ?? ""),
          ornekler: Array.isArray(row.ornekler)
            ? (row.ornekler as string[])
            : [],
          m2Min: Number(row.m2Min) || 60,
          m2Max: Number(row.m2Max) || 500,
          itemSayisi: Number(row.itemSayisi ?? row.kalemSayisi) || 0,
          zorunluSayisi: Number(row.zorunluSayisi) || 0,
        };
      });
    }
    if (Array.isArray(o.data)) {
      return parseConceptsResponse(o.data);
    }
  }
  return [];
}
