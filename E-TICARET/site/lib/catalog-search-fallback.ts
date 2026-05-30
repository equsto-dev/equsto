import {
  catalogUrlSlug,
  foldTr,
  legacyMeiliPathSlug,
} from "@/lib/catalog-product-slug";
import { loadDeptJson, loadEkipmanlarJson } from "@/lib/catalog-json";
import { mergeSearchHitsDiverse } from "@/lib/search-diverse-merge";
import { deptSearchHints, expandSearchQueries } from "@/lib/search-synonyms";

export type CatalogSearchHit = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  kaynak: string;
  category: string;
  dept: string;
  model: string;
  sku: string;
  price: string;
  liste_fiyati_eur: number | null;
  satis_eur_indirimli: number | null;
  iskonto_oran: number | null;
  image: string;
  url: string;
  specs: string;
};

type CatalogRow = Record<string, unknown>;

let cache: { rows: CatalogRow[] } | null = null;
const deptRowCache = new Map<string, CatalogRow[]>();

type CatalogLookupMaps = {
  rows: CatalogRow[];
  byMeiliId: Map<string, CatalogRow>;
  byCatalogSlug: Map<string, CatalogRow>;
  byLegacySlug: Map<string, CatalogRow>;
};

let lookupMaps: CatalogLookupMaps | null = null;

function meiliId(raw: string) {
  return String(raw || "")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 500);
}

function docId(row: CatalogRow, dept: string) {
  if (row.id) return meiliId(String(row.id));
  const sku = String(row.sku || row.model || "");
  if (sku) return meiliId(`${dept}__${sku}`);
  return meiliId(`${dept}__${catalogUrlSlug(row)}`);
}

function firstImage(row: CatalogRow) {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs[0]) return "";
  return String(imgs[0]).replace(/\\/g, "/");
}

export function rowToHitFromRow(row: CatalogRow): CatalogSearchHit | null {
  const name = String(row.name || "").trim();
  if (!name) return null;
  const dept = String(row.dept || "").trim();
  if (!dept) return null;
  const slug = catalogUrlSlug(row);
  const id = docId(row, dept);
  return {
    id,
    slug,
    name,
    brand: String(row.brand || "").trim(),
    kaynak: String(row.kaynak || row.kaynak_fiyat_listesi || "").trim(),
    category: String(row.category || "").trim(),
    dept,
    model: String(row.model || row.sku || "").trim(),
    sku: String(row.sku || "").trim(),
    price: String(row.price || "").split("\n")[0].slice(0, 120),
    liste_fiyati_eur: Number(row.liste_fiyati_eur) || null,
    satis_eur_indirimli:
      Number(row.satis_eur_indirimli || row.satis_fiyati_eur) || null,
    iskonto_oran: Number(row.iskonto_oran) || null,
    image: firstImage(row),
    url: `/shop/${dept}/${slug}`,
    specs: [
      String(row.specs || ""),
      Array.isArray(row.keywords) ? (row.keywords as string[]).join(" ") : "",
      String(row.aciklama || ""),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000),
  };
}

async function loadCatalogRows(): Promise<CatalogRow[]> {
  if (cache) return cache.rows;
  try {
    const rows = await loadEkipmanlarJson();
    const list = Array.isArray(rows) ? rows : [];
    cache = { rows: list };
    lookupMaps = null;
    return list;
  } catch {
    return [];
  }
}

async function loadDeptRows(dept: string): Promise<CatalogRow[]> {
  const key = String(dept || "").trim();
  if (!key) return [];
  const hit = deptRowCache.get(key);
  if (hit) return hit;

  try {
    const raw = await loadDeptJson(key);
    const list = Array.isArray(raw) ? (raw as CatalogRow[]) : [];
    const rows = list.map((row) => ({
      ...row,
      dept: String(row.dept || key).trim(),
    }));
    deptRowCache.set(key, rows);
    return rows;
  } catch {
    return [];
  }
}

async function loadRowsForSearch(depts?: string[]): Promise<CatalogRow[]> {
  if (!depts?.length) return loadCatalogRows();
  const parts = await Promise.all(depts.map((d) => loadDeptRows(d)));
  return parts.flat();
}

export async function getCatalogLookupMaps(): Promise<CatalogLookupMaps> {
  if (lookupMaps) return lookupMaps;
  const rows = await loadCatalogRows();
  const byMeiliId = new Map<string, CatalogRow>();
  const byCatalogSlug = new Map<string, CatalogRow>();
  const byLegacySlug = new Map<string, CatalogRow>();

  for (const row of rows) {
    const dept = String(row.dept || "").trim();
    if (!dept) continue;
    const mid = docId(row, dept);
    byMeiliId.set(mid, row);
    const slug = catalogUrlSlug(row).toLowerCase();
    byCatalogSlug.set(slug, row);
    const cid = String(row.id || "")
      .trim()
      .toLowerCase();
    if (cid) byCatalogSlug.set(cid, row);
    const legacy = legacyMeiliPathSlug(row);
    if (legacy) byLegacySlug.set(legacy, row);
  }

  lookupMaps = { rows, byMeiliId, byCatalogSlug, byLegacySlug };
  return lookupMaps;
}

function rowHaystack(row: CatalogRow) {
  const dept = String(row.dept || "");
  const category = String(row.category || "");
  return foldTr(
    [
      row.name,
      row.brand,
      category,
      dept,
      deptSearchHints(dept, category),
      row.sku,
      row.model,
      row.specs,
      row.aciklama,
      Array.isArray(row.keywords) ? (row.keywords as string[]).join(" ") : "",
    ].join(" "),
  );
}

function scoreRow(hay: string, tokens: string[]) {
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (hay.includes(t)) score += 10;
    const words = hay.split(/\s+/);
    for (const w of words) {
      if (w.startsWith(t)) score += 4;
    }
  }
  return score;
}

function collectTokens(q: string) {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const variant of expandSearchQueries(q)) {
    for (const t of foldTr(variant).split(/\s+/)) {
      if (t.length < 2) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      tokens.push(t);
    }
  }
  return tokens;
}

export type FallbackSearchOptions = {
  /** Yalnızca bu dept JSON dosyalarında ara (daha hızlı). */
  depts?: string[];
};

/** Meilisearch yokken veya hibrit tamamlamada — katalog JSON üzerinde arama */
export async function fallbackCatalogSearch(
  q: string,
  limit: number,
  opts?: FallbackSearchOptions,
) {
  const query = String(q || "").trim();
  if (!query) return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };

  const tokens = collectTokens(query);
  if (!tokens.length) {
    return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };
  }

  const rows = await loadRowsForSearch(opts?.depts);
  const byId = new Map<string, { hit: CatalogSearchHit; score: number }>();

  for (const row of rows) {
    const hay = rowHaystack(row);
    const score = scoreRow(hay, tokens);
    if (score <= 0) continue;
    const hit = rowToHitFromRow(row);
    if (!hit) continue;
    const prev = byId.get(hit.id);
    if (!prev || score > prev.score) byId.set(hit.id, { hit, score });
  }

  const scored = [...byId.values()].sort((a, b) => b.score - a.score);
  const ranked = scored.map((x) => x.hit);
  const hits = mergeSearchHitsDiverse(ranked, [], limit);
  return {
    hits,
    estimatedTotalHits: scored.length,
  };
}
