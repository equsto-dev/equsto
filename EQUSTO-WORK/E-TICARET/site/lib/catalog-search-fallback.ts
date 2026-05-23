import { loadEkipmanlarJson } from "@/lib/catalog-json";
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

function foldTr(s: string) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

function slugify(s: string) {
  return foldTr(s)
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function meiliId(raw: string) {
  return String(raw || "")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_+]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 500);
}

function productSlug(row: CatalogRow) {
  const b = slugify(String(row.brand || ""));
  const n = slugify(String(row.name || ""));
  return (b ? `${b}-` : "") + n;
}

function docId(row: CatalogRow, dept: string) {
  if (row.id) return meiliId(String(row.id));
  const sku = String(row.sku || row.model || "");
  if (sku) return meiliId(`${dept}__${sku}`);
  return meiliId(`${dept}__${productSlug(row)}`);
}

function firstImage(row: CatalogRow) {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs[0]) return "";
  return String(imgs[0]).replace(/\\/g, "/");
}

function rowToHit(row: CatalogRow): CatalogSearchHit | null {
  const name = String(row.name || "").trim();
  if (!name) return null;
  const dept = String(row.dept || "").trim();
  if (!dept) return null;
  const slug = productSlug(row);
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
    return list;
  } catch {
    return [];
  }
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

/** Meilisearch yokken veya eksik sonuçta — ekipmanlar.json üzerinde arama */
export async function fallbackCatalogSearch(q: string, limit: number) {
  const query = String(q || "").trim();
  if (!query) return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };

  const tokens = collectTokens(query);
  if (!tokens.length) {
    return { hits: [] as CatalogSearchHit[], estimatedTotalHits: 0 };
  }

  const rows = await loadCatalogRows();
  const byId = new Map<string, { hit: CatalogSearchHit; score: number }>();

  for (const row of rows) {
    const hay = rowHaystack(row);
    const score = scoreRow(hay, tokens);
    if (score <= 0) continue;
    const hit = rowToHit(row);
    if (!hit) continue;
    const prev = byId.get(hit.id);
    if (!prev || score > prev.score) byId.set(hit.id, { hit, score });
  }

  const scored = [...byId.values()].sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, limit).map((x) => x.hit);
  return {
    hits,
    estimatedTotalHits: scored.length,
  };
}
