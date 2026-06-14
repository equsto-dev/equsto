import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { dataRel, readJsonFile } from "@/lib/legacy-data";

/** Birleştirme sonrası yazılan tek özet — panel ve API buradan okur. */
export type CatalogMeta = {
  version?: string;
  rebuiltAt?: string;
  ekipmanlar?: number;
  withImage?: number;
  brands?: number;
  deptCounts?: Record<string, number>;
  inoksanComDescriptions?: number;
  inoksanShopDescriptions?: number;
  inoksanMissing?: number | null;
  productsEnCount?: number | null;
  productsEnStale?: number;
};

export type CatalogStats = {
  ekipmanlar: number;
  withImage: number;
  brands: number;
  rebuiltAt?: string;
  inoksanComDescriptions?: number;
  inoksanShopDescriptions?: number;
  productsEnCount?: number;
  productsEnStale?: number;
  /** meta.ekipmanlar ≠ canlı ekipmanlar.json satır sayısı */
  liveDrift?: number;
  source: "catalog-meta.json" | "ekipmanlar.json" | "missing";
};

export const CATALOG_REBUILD_CMD = "node scripts/rebuild-ekipmanlar-from-dept.mjs";

export async function loadCatalogMeta(): Promise<CatalogMeta | null> {
  return readJsonFile<CatalogMeta>(dataRel("catalog-meta.json"));
}

export function catalogStatsFromMeta(
  meta: CatalogMeta,
  opts?: { liveDrift?: number },
): CatalogStats {
  const productsEnCount =
    meta.productsEnCount != null ? meta.productsEnCount : undefined;
  const productsEnStale =
    meta.productsEnStale ??
    (productsEnCount != null &&
    meta.ekipmanlar != null &&
    productsEnCount < meta.ekipmanlar
      ? meta.ekipmanlar - productsEnCount
      : 0);

  return {
    ekipmanlar: meta.ekipmanlar ?? 0,
    withImage: meta.withImage ?? 0,
    brands: meta.brands ?? 0,
    rebuiltAt: meta.rebuiltAt,
    inoksanComDescriptions: meta.inoksanComDescriptions,
    inoksanShopDescriptions: meta.inoksanShopDescriptions,
    productsEnCount,
    productsEnStale: productsEnStale > 0 ? productsEnStale : undefined,
    liveDrift: opts?.liveDrift,
    source: "catalog-meta.json",
  };
}

/** Meta yoksa ekipmanlar.json satır sayısı; verify=true ise meta↔canlı farkı. */
export async function loadCatalogStats(opts?: {
  verifyLive?: boolean;
}): Promise<CatalogStats> {
  const meta = await loadCatalogMeta();
  if (meta?.ekipmanlar != null) {
    let liveDrift: number | undefined;
    if (opts?.verifyLive) {
      try {
        const raw = await loadEkipmanlarJson();
        const live = Array.isArray(raw) ? raw.length : 0;
        if (live !== meta.ekipmanlar) liveDrift = live - meta.ekipmanlar;
      } catch {
        /* ekipmanlar okunamadı */
      }
    }
    return catalogStatsFromMeta(meta, { liveDrift });
  }

  try {
    const raw = await loadEkipmanlarJson();
    const n = Array.isArray(raw) ? raw.length : 0;
    return {
      ekipmanlar: n,
      withImage: 0,
      brands: 0,
      source: "ekipmanlar.json",
    };
  } catch {
    return { ekipmanlar: 0, withImage: 0, brands: 0, source: "missing" };
  }
}
