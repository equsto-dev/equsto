import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { foldTr } from "@/lib/search-query";
import {
  isDisplayableSearchQuery,
  sanitizeVisionQueryText,
} from "@/lib/search/parse-vision-output";
import type { ImageVisionQuery } from "@/lib/search/image-vision-query";

const RETAILER_NAMES = new Set(["equsto"]);

/** Meilisearch'te gürültü yapan genel sıfatlar. */
const WEAK_TOKENS = new Set([
  "bar",
  "endustriyel",
  "sanayi",
  "tipi",
  "makine",
  "makinesi",
  "ekipman",
  "ekipmani",
  "unitesi",
  "model",
  "luks",
  "profesyonel",
]);

const BAR_STATION_RE =
  /kokteyl|bar\s*istasyon|bar\s*tezg|moduler\s*bar|buz\s*(kuyu|hazne|kuyusu)|speed\s*rail|kokteyl\s*tezg|kokteyl\s*bar/;

const BAR_STATION_FALSE_POSITIVE_RE =
  /blender|salat\s*bar|salad|puree|sikac|meyve\s*sik|bardak\s*yik|filtre\s*kahve|cay\s*makin/;

/** Görselde okunmayan satıcı / katalog adlarını ayıkla. */
function stripRetailerTokens(text: string): string {
  return text
    .replace(/\bequsto\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripGenericFiller(q: string): string {
  return q
    .replace(/\bendüstriyel\b/gi, " ")
    .replace(/\bsanayi\s*tipi\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeBrand(brand: string): string {
  const b = stripRetailerTokens(brand.trim());
  if (!b) return "";
  const folded = foldTr(b);
  if (RETAILER_NAMES.has(folded)) return "";
  return b;
}

function normalizeQueryCandidate(raw: string): string {
  let q = stripRetailerTokens(String(raw || "").trim());
  try {
    q = sanitizeVisionQueryText(q);
  } catch {
    return "";
  }
  q = stripGenericFiller(q);
  if (!q || !isDisplayableSearchQuery(q)) return "";
  return q;
}

/** Vision JSON → Meilisearch sorgusu (marka yalnızca görselde okunduysa). */
export function buildVisualSearchQuery(vision: ImageVisionQuery): string {
  let q = stripRetailerTokens(String(vision.q || "").trim());
  try {
    q = sanitizeVisionQueryText(q);
  } catch {
    return "";
  }
  q = stripGenericFiller(q);
  const brand = sanitizeBrand(vision.brand || "");
  const model = String(vision.model || "").trim();

  if (brand && !foldTr(q).includes(foldTr(brand))) {
    q = `${brand} ${q}`.trim();
  }
  if (model && !foldTr(q).includes(foldTr(model))) {
    q = `${q} ${model}`.trim();
  }
  return q;
}

function meaningfulTokens(q: string): string[] {
  return foldTr(q)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 4 && !RETAILER_NAMES.has(t));
}

function discriminatingTokens(q: string): string[] {
  return meaningfulTokens(q).filter((t) => !WEAK_TOKENS.has(t));
}

export function isBarStationVisualQuery(q: string): boolean {
  return BAR_STATION_RE.test(foldTr(q));
}

/** Modüler bar istasyonları Besos vitrininde; ana katalogda yoksa yönlendir. */
export function suggestBesosUrlForVisualQuery(q: string): string | null {
  if (!isBarStationVisualQuery(q)) return null;
  return "/besos/bar-istasyonlari";
}

/** Vision çıktısından sırayla denenecek sorgular. */
export function expandVisualSearchQueries(vision: ImageVisionQuery): string[] {
  const primary = buildVisualSearchQuery(vision);
  const out: string[] = [];
  const add = (raw: string) => {
    const t = normalizeQueryCandidate(raw);
    if (t && !out.includes(t)) out.push(t);
  };

  add(primary);
  const folded = foldTr(primary);
  if (folded.includes("bar") && folded.includes("istasyon")) {
    add("kokteyl bar istasyonu");
    add("modüler kokteyl tezgahı");
    add("kokteyl tezgahı");
  }
  if (isBarStationVisualQuery(primary)) {
    add("kokteyl bar istasyonu");
    add("modüler bar tezgahı");
  }
  if (folded.includes("buz") && (folded.includes("kuyu") || folded.includes("hazne"))) {
    add("buz hazneli bar tezgahı");
  }
  return out;
}

/** Görsel arama için tek bir hit'in alaka puanı. */
export function scoreVisualHit(q: string, hit: CatalogSearchHit): number {
  const name = foldTr(hit.name || "");
  const cat = foldTr(hit.category || "");
  const specs = foldTr(hit.specs || "");
  const blob = `${name} ${cat} ${specs}`;

  let score = 0;
  const strong = discriminatingTokens(q);
  const weak = meaningfulTokens(q).filter((t) => !strong.includes(t));

  for (const t of strong) {
    if (name.includes(t)) score += 3;
    else if (cat.includes(t)) score += 1;
    else if (specs.includes(t)) score += 0.5;
  }
  for (const t of weak) {
    if (name.includes(t)) score += 0.5;
    else if (blob.includes(t)) score += 0.15;
  }

  if (isBarStationVisualQuery(q) && BAR_STATION_FALSE_POSITIVE_RE.test(name)) {
    score -= 5;
  }

  return score;
}

export function rerankVisualHits(
  q: string,
  hits: CatalogSearchHit[],
): CatalogSearchHit[] {
  return [...hits].sort(
    (a, b) => scoreVisualHit(q, b) - scoreVisualHit(q, a),
  );
}

const MIN_VISUAL_MATCH_SCORE = 2.5;

/** Üst sonuçlar sorguyla anlamlı örtüşüyor mu? */
export function visualCatalogMatch(q: string, hits: CatalogSearchHit[]): boolean {
  if (!hits.length) return false;
  const top = hits.slice(0, 8);
  const best = Math.max(...top.map((h) => scoreVisualHit(q, h)));
  if (best < MIN_VISUAL_MATCH_SCORE) return false;

  const strong = discriminatingTokens(q);
  if (!strong.length) return best >= 4;

  return top.some((h) => {
    const blob = foldTr(
      `${h.name || ""} ${h.category || ""} ${h.brand || ""} ${h.specs || ""}`,
    );
    return strong.some((t) => blob.includes(t));
  });
}
