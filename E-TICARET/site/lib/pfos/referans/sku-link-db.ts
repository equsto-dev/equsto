import type { PfosReferansSkuLink } from "@/lib/prisma";
import { db } from "@/lib/db";
import { parseReferansLinkKey, referansLinkKey } from "./sku-link-key";

export type ReferansSkuLinkEntry = {
  sku: string;
  marka?: string;
  name?: string;
  fiyat_try?: number;
};

export type ReferansSkuLinksMap = Record<string, ReferansSkuLinkEntry>;

let dbLinksCache: ReferansSkuLinksMap | null = null;
let dbLinksCacheAt = 0;
const DB_LINKS_TTL_MS = 60_000;

function rowToEntry(row: PfosReferansSkuLink): ReferansSkuLinkEntry {
  return {
    sku: row.sku,
    marka: row.marka ?? undefined,
    name: row.name ?? undefined,
  };
}

/** DB'deki onaylı linkleri map olarak yükle (kısa TTL cache). */
export async function loadDbReferansSkuLinks(
  force = false,
): Promise<ReferansSkuLinksMap> {
  const now = Date.now();
  if (!force && dbLinksCache && now - dbLinksCacheAt < DB_LINKS_TTL_MS) {
    return dbLinksCache;
  }
  try {
    const rows = await db.pfosReferansSkuLink.findMany();
    const map: ReferansSkuLinksMap = {};
    for (const row of rows) {
      map[row.linkKey] = rowToEntry(row);
    }
    dbLinksCache = map;
    dbLinksCacheAt = now;
    return map;
  } catch {
    return dbLinksCache ?? {};
  }
}

export function invalidateDbReferansSkuLinksCache(): void {
  dbLinksCache = null;
  dbLinksCacheAt = 0;
}

/** JSON linkleri üzerine DB kayıtlarını yazar (DB kazanır). */
export async function mergeDbAndJsonLinks(
  jsonLinks: ReferansSkuLinksMap,
): Promise<ReferansSkuLinksMap> {
  const dbLinks = await loadDbReferansSkuLinks();
  return { ...jsonLinks, ...dbLinks };
}

export type UpsertReferansSkuLinkInput = {
  listeKey: string;
  poz: string;
  sku: string;
  name?: string | null;
  marka?: string | null;
  kaynak?: string;
  oneriId?: string | null;
  onaylayan?: string | null;
};

export async function upsertReferansSkuLink(
  input: UpsertReferansSkuLinkInput,
): Promise<PfosReferansSkuLink> {
  const linkKey = referansLinkKey(input.listeKey, input.poz);
  const row = await db.pfosReferansSkuLink.upsert({
    where: { linkKey },
    create: {
      linkKey,
      listeKey: input.listeKey.trim().toLowerCase(),
      poz: input.poz.trim().toUpperCase(),
      sku: input.sku.trim(),
      name: input.name?.trim() || null,
      marka: input.marka?.trim() || null,
      kaynak: input.kaynak ?? "feedback",
      oneriId: input.oneriId ?? null,
      onaylayan: input.onaylayan ?? null,
    },
    update: {
      sku: input.sku.trim(),
      name: input.name?.trim() || null,
      marka: input.marka?.trim() || null,
      kaynak: input.kaynak ?? "feedback",
      oneriId: input.oneriId ?? null,
      onaylayan: input.onaylayan ?? null,
    },
  });
  invalidateDbReferansSkuLinksCache();
  return row;
}

export async function listReferansSkuLinks(limit = 500): Promise<PfosReferansSkuLink[]> {
  return db.pfosReferansSkuLink.findMany({
    orderBy: { updatedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 5000),
  });
}

export async function deleteReferansSkuLink(linkKey: string): Promise<boolean> {
  const parsed = parseReferansLinkKey(linkKey);
  if (!parsed) return false;
  const key = referansLinkKey(parsed.listeKey, parsed.poz);
  const res = await db.pfosReferansSkuLink.deleteMany({ where: { linkKey: key } });
  if (res.count > 0) invalidateDbReferansSkuLinksCache();
  return res.count > 0;
}
