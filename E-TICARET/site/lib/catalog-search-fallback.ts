import {
  catalogUrlSlug,
  legacyMeiliPathSlug,
} from "@/lib/catalog-product-slug";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { deptSearchHints, expandSearchQueries } from "@/lib/search-synonyms";
import { isIzgaraAccessory, isKuzineWithFirin, isFirinAccessory } from "@/lib/category-search-hints";
import { foldTr, splitQueryOrBranches } from "@/lib/search-query";
import {
  diversifySearchHits,
  rankSearchHitsByRelevance,
  shouldDiversifySearchHits,
} from "@/lib/rank-search-hits";

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
  equsto_kod?: string;
  marka_kodu?: string;
  marka_urun_kodu?: string;
  kategori_yolu?: string[];
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

type CatalogLookupMaps = {
  rows: CatalogRow[];
  byMeiliId: Map<string, CatalogRow>;
  byCatalogSlug: Map<string, CatalogRow>;
  byLegacySlug: Map<string, CatalogRow>;
  byEqustoKod: Map<string, CatalogRow>;
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
    equsto_kod: String(row.equsto_kod || "").trim() || undefined,
    marka_kodu: String(row.marka_kodu || "").trim() || undefined,
    marka_urun_kodu: String(row.marka_urun_kodu || "").trim() || undefined,
    kategori_yolu: Array.isArray(row.kategori_yolu)
      ? (row.kategori_yolu as string[])
      : undefined,
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

export async function getCatalogLookupMaps(): Promise<CatalogLookupMaps> {
  if (lookupMaps) return lookupMaps;
  const rows = await loadCatalogRows();
  const byMeiliId = new Map<string, CatalogRow>();
  const byCatalogSlug = new Map<string, CatalogRow>();
  const byLegacySlug = new Map<string, CatalogRow>();
  const byEqustoKod = new Map<string, CatalogRow>();

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
    const eq = String(row.equsto_kod || "")
      .trim()
      .toUpperCase();
    if (eq) byEqustoKod.set(eq, row);
  }

  lookupMaps = { rows, byMeiliId, byCatalogSlug, byLegacySlug, byEqustoKod };
  return lookupMaps;
}

/** Master tablo EQ- kodu ile doğrudan katalog satırı */
export async function lookupCatalogByEqustoKod(
  equstoKod: string,
): Promise<CatalogSearchHit | null> {
  const kod = String(equstoKod || "").trim().toUpperCase();
  if (!kod.startsWith("EQ-")) return null;
  const maps = await getCatalogLookupMaps();
  const row = maps.byEqustoKod.get(kod);
  if (row) return rowToHitFromRow(row);

  const { lookupMasterByEqustoKod } = await import(
    "@/lib/catalog/master-catalog"
  );
  return lookupMasterByEqustoKod(kod);
}

function rowHaystack(row: CatalogRow) {
  const dept = String(row.dept || "");
  const category = String(row.category || "");
  const name = String(row.name || "");
  return foldTr(
    [
      name,
      row.brand,
      category,
      dept,
      deptSearchHints(dept, category, name),
      row.sku,
      row.model,
      row.equsto_kod,
      row.marka_kodu,
      row.marka_urun_kodu,
      Array.isArray(row.kategori_yolu) ? row.kategori_yolu.join(" ") : "",
    ].join(" "),
  );
}

function scoreToken(hay: string, t: string): number {
  if (!t) return 0;
  if (!hay.includes(t)) return 0;
  let score = 10;
  const words = hay.split(/\s+/);
  for (const w of words) {
    if (w.startsWith(t)) score += 4;
    if (t.length >= 4 && w.includes(t)) score += 6;
  }
  return score;
}

/** Bir OR dalı — tüm tokenlar eşleşmeli. */
function scoreBranch(hay: string, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  for (const t of tokens) {
    const part = scoreToken(hay, t);
    if (part <= 0) return 0;
    score += part;
  }
  return score;
}

function collectTokensForBranch(branch: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const variant of expandSearchQueries(branch)) {
    for (const t of foldTr(variant).split(/\s+/)) {
      if (t.length < 2) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      tokens.push(t);
    }
  }
  return tokens;
}

function collectOrTokenBranches(q: string): string[][] {
  return splitQueryOrBranches(q)
    .map(collectTokensForBranch)
    .filter((tokens) => tokens.length > 0);
}

function scoreRowOr(hay: string, branches: string[][]): number {
  let best = 0;
  for (const tokens of branches) {
    best = Math.max(best, scoreBranch(hay, tokens));
  }
  return best;
}

export type FallbackSearchOptions = {
  /** @deprecated Tüm katalogda aranır; dept kısıtı kullanılmaz. */
  depts?: string[];
  offset?: number;
};

/** Meilisearch yokken veya hibrit tamamlamada — katalog JSON üzerinde arama */
export async function fallbackCatalogSearch(
  q: string,
  limit: number,
  opts?: FallbackSearchOptions,
) {
  const query = String(q || "").trim();
  const offset = Math.max(opts?.offset ?? 0, 0);
  if (!query) return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };

  const branches = collectOrTokenBranches(query);
  if (!branches.length) {
    return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };
  }

  const rows = await loadCatalogRows();
  const byId = new Map<string, { hit: CatalogSearchHit; score: number }>();

  for (const row of rows) {
    const name = String(row.name || "");
    const category = String(row.category || "");
    const dept = String(row.dept || "");
    const queryFold = foldTr(query);
    if (
      (queryFold === "izgara" || queryFold === "izgaralar" || queryFold === "ızgara") &&
      (dept === "istif" || isIzgaraAccessory(name, category))
    ) {
      continue;
    }
    if (
      (queryFold === "firin" || queryFold === "firinlar" || queryFold === "fırın") &&
      (isKuzineWithFirin(name, category) || isFirinAccessory(name, category))
    ) {
      continue;
    }
    const hay = rowHaystack(row);
    const score = scoreRowOr(hay, branches);
    if (score <= 0) continue;
    const hit = rowToHitFromRow(row);
    if (!hit) continue;
    const prev = byId.get(hit.id);
    if (!prev || score > prev.score) byId.set(hit.id, { hit, score });
  }

  const scored = [...byId.values()].sort((a, b) => b.score - a.score);
  let ranked = rankSearchHitsByRelevance(
    query,
    scored.map((x) => x.hit),
  );
  if (shouldDiversifySearchHits(query)) {
    ranked = diversifySearchHits(query, ranked, ranked.length);
  }
  const hits = ranked.slice(offset, offset + limit);
  return {
    hits,
    estimatedTotalHits: scored.length,
  };
}
