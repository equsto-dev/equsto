import { foldTr } from "@/lib/search-query";
import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import type { ParsedItem, MatchedItem, MeiliKalemEslestirme, MeilisearchHitDto } from "./types";
import { searchCatalogForProforma } from "./meili-search";
import { hitToEslesmis } from "./hit-to-eslesmis";
import { buildMeiliSearchQuery, cleanProformaTanim } from "./sanitize-tanim";
import {
  dishwasherFeatureScore,
  requiresDishwasher,
  requiresShelvedTezgah,
  requiresSinkTezgah,
  requiresTrolley,
  shelfFeatureScore,
  sinkFeatureScore,
  trolleyFeatureScore,
} from "./match-features";
import {
  generateEqustoTezgahSku,
  isCalismaTezgahiReferansIsim,
} from "../core/calisma-tezgah";
import { isIstifRafiReferansIsim } from "../core/portashelf-marka";
import { matchIstifRafiByReferans } from "../referans/istif-raf-match";
import {
  guessEqustoKodFromItem,
  matchCatalogByEqustoKod,
} from "@/lib/catalog/equsto-kod-lookup";
import { referansKatalogUyumsuz } from "../referans/referans-eslestirme";


/** Ölçü benzerliği — boyutlar yakınsa bonus */
export function olcuSkoru(olcu1: string, olcu2: string): number {
  if (!olcu1 || !olcu2) return 0;

  const norm = (s: string) =>
    s
      .split("/")[0]
      .replace(/[^0-9*]/g, "")
      .split("*")
      .map(Number);

  const d1 = norm(olcu1);
  const d2 = norm(olcu2);
  if (d1.length !== d2.length || d1.some((n) => !Number.isFinite(n))) return 0;

  const farklar = d1.map((v, i) => Math.abs(v - d2[i]) / Math.max(v, d2[i], 1));
  const ortalamaFark = farklar.reduce((a, b) => a + b, 0) / farklar.length;
  if (ortalamaFark < 0.1) return 1;
  if (ortalamaFark < 0.2) return 0.7;
  return 0;
}

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

function hitToDto(hit: CatalogSearchHit): MeilisearchHitDto {
  const eur = hit.satis_eur_indirimli ?? hit.liste_fiyati_eur ?? 0;
  return {
    id: hit.id,
    urun_adi: hit.name,
    stok_no: hit.sku || hit.model || "",
    marka: hit.brand,
    olcu: hit.model || undefined,
    satis_fiyati_eur: eur,
    kategori: hit.category || hit.dept,
  };
}

function tokenOverlapScore(query: string, hit: CatalogSearchHit): number {
  const tokens = foldTr(query)
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (!tokens.length) return 0;
  const hay = foldTr([hit.name, hit.brand, hit.specs, hit.sku, hit.category].join(" "));
  const matched = tokens.filter((t) => hay.includes(t)).length;
  return matched / tokens.length;
}

function categoryMismatchPenalty(item: ParsedItem, hit: CatalogSearchHit): number {
  const q = foldTr(cleanProformaTanim(item.tanim));
  const hay = foldTr([hit.name, hit.category, hit.dept, hit.specs, hit.sku].join(" "));

  let penalty = 0;
  if (/banket|sicak\s*banket/.test(q) && /bulasik|yikama|bym\d|bardak/.test(hay)) {
    penalty += 280;
  }
  if (/bulasik|yikama|giyotin|siyirma/.test(q) && /banket|servis\s*arab/.test(hay)) {
    penalty += 280;
  }
  if (/servis tezgah|make.?up/.test(q) && /bulasik|yikama/.test(hay)) penalty += 150;
  if (/bulasik|yikama|giyotin/.test(q) && !/bulasik|yikama|giyotin/.test(hay)) penalty += 60;
  if (/firin|konveksiyon/.test(q) && /kuzine|ocak/.test(hay) && !/firin/.test(hay)) {
    penalty += 80;
  }
  return penalty;
}

function brandBonus(item: ParsedItem, hit: CatalogSearchHit): number {
  const marka = foldTr(item.marka_orijinal ?? "");
  if (!marka || marka === "skturk") return 0;
  const hay = foldTr([hit.brand, hit.name, hit.kaynak].join(" "));
  if (!hay.includes(marka)) return 0;
  if (foldTr(hit.brand) === marka) return 25;
  return 10;
}

/** 190*70*85 + raf tipi → EQUSTO.19070.04 / .08 */
function guessEqustoTezgahSkuFromOlcu(
  olcu: string | null | undefined,
  tanim: string,
): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const parts = raw.split("*").map((p) => parseInt(p.replace(/\D/g, ""), 10));
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  const code = `${parts[0]}${String(parts[1]).padStart(2, "0")}`;
  const base = `EQUSTO.${code}`;
  const q = foldTr(cleanProformaTanim(tanim));
  if (/taban\s*(ve\s*)?ara|ara\s*raf|rfli/.test(q)) return `${base}.04`;
  if (/taban\s*raf/.test(q)) return `${base}.08`;
  if (/rafl|rafli|rfli/.test(q)) return `${base}.04`;
  return null;
}

/** 190*70*85 → 7912.19070.00 benzeri Öztiryakiler kod araması */
function guessOztiSkuFromOlcu(olcu: string | null | undefined): string | null {
  const raw = String(olcu ?? "").split("/")[0];
  const parts = raw.split("*").map((p) => parseInt(p.replace(/\D/g, ""), 10));
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  const code = `${parts[0]}${String(parts[1]).padStart(2, "0")}`;
  return `7912.${code}`;
}

function scoreHit(item: ParsedItem, query: string, hit: CatalogSearchHit): number {
  return (
    tokenOverlapScore(query, hit) * 50 +
    brandBonus(item, hit) +
    olcuSkoru(item.olcu, hit.model || "") * 20 +
    shelfFeatureScore(item.tanim, hit) +
    sinkFeatureScore(item.tanim, hit) +
    trolleyFeatureScore(item.tanim, hit) +
    dishwasherFeatureScore(item.tanim, hit) -
    categoryMismatchPenalty(item, hit)
  );
}

function pickBestHit(
  item: ParsedItem,
  hits: CatalogSearchHit[],
): { hit: CatalogSearchHit | null; guven: number } {
  if (!hits.length) return { hit: null, guven: 0 };
  const query = buildMeiliSearchQuery(item);

  const validHits = hits.filter(
    (h) => !referansKatalogUyumsuz(item.tanim, h.name, item.olcu, h.sku)
  );
  if (!validHits.length) return { hit: null, guven: 0 };

  const ranked = [...validHits].sort((a, b) => {
    const sa = scoreHit(item, query, a);
    const sb = scoreHit(item, query, b);
    return sb - sa;
  });

  let best = ranked[0];
  const needsShelf = requiresShelvedTezgah(item.tanim);
  const needsTrolley = requiresTrolley(item.tanim);
  const needsDishwasher = requiresDishwasher(item.tanim);
  const needsSink = requiresSinkTezgah(item.tanim);

  function hitFeaturesOk(hit: CatalogSearchHit): boolean {
    if (needsShelf && shelfFeatureScore(item.tanim, hit) <= 0) return false;
    if (needsSink && sinkFeatureScore(item.tanim, hit) <= 0) return false;
    if (needsTrolley && trolleyFeatureScore(item.tanim, hit) <= 0) return false;
    if (needsDishwasher && dishwasherFeatureScore(item.tanim, hit) <= 0) {
      return false;
    }
    return true;
  }

  if (!hitFeaturesOk(best)) {
    const alt = ranked.find((h) => hitFeaturesOk(h));
    if (alt) best = alt;
    else return { hit: null, guven: 0 };
  }

  const overlap = tokenOverlapScore(query, best);
  const featuresMatch = hitFeaturesOk(best);
  const guven = Math.min(
    0.95,
    (featuresMatch ? 0.3 : 0.15) +
      overlap * 0.45 +
      olcuSkoru(item.olcu, best.model || "") * 0.15 +
      (brandBonus(item, best) > 0 ? 0.1 : 0),
  );
  return { hit: best, guven };
}

export type ItemMatchResult = {
  matched: MatchedItem;
  bestHit: CatalogSearchHit | null;
};

function matchFromEqustoHit(
  item: ParsedItem,
  hit: CatalogSearchHit,
  guven = 0.97,
): ItemMatchResult {
  const dto = hitToDto(hit);
  const birim = dto.satis_fiyati_eur > 0 ? dto.satis_fiyati_eur : null;
  return {
    bestHit: hit,
    matched: {
      ...item,
      tanim: cleanProformaTanim(item.tanim) || item.tanim,
      eslesen_urun: dto,
      eslesen_skor: guven,
      birim_fiyat_eur: birim,
      toplam_eur:
        birim != null ? Math.round(birim * item.adet * 100) / 100 : null,
      not_found: false,
    },
  };
}

export async function matchItem(item: ParsedItem): Promise<ItemMatchResult> {
  if (item.mevcut) {
    return {
      matched: {
        ...item,
        eslesen_urun: null,
        eslesen_skor: 0,
        birim_fiyat_eur: null,
        toplam_eur: null,
        not_found: false,
      },
      bestHit: null,
    };
  }

  const equstoKod = guessEqustoKodFromItem(item);
  if (equstoKod) {
    const eqHit = await matchCatalogByEqustoKod(equstoKod);
    if (eqHit && !referansKatalogUyumsuz(item.tanim, eqHit.name, item.olcu, eqHit.sku)) {
      return matchFromEqustoHit(item, eqHit);
    }
  }

  if (isIstifRafiReferansIsim(item.tanim)) {
    const istif = await matchIstifRafiByReferans(
      item.tanim,
      item.olcu,
      null,
    );
    if (istif?.sku) {
      const bestHit = {
        id: istif.id,
        name: istif.ad,
        sku: istif.sku,
        brand: istif.marka,
        category: "istif",
        dept: "istif",
        specs: item.tanim,
        image: String(istif.gorselUrl ?? "").replace(/^\/data\//, ""),
        slug: istif.id,
        satis_eur_indirimli: istif.fiyatEur ?? null,
        liste_fiyati_eur: istif.fiyatEur ?? null,
      } as CatalogSearchHit;
      const { hit: ranked, guven } = pickBestHit(item, [bestHit]);
      if (ranked) {
        const dto = hitToDto(ranked);
        const birim = dto.satis_fiyati_eur > 0 ? dto.satis_fiyati_eur : null;
        return {
          bestHit: ranked,
          matched: {
            ...item,
            tanim: cleanProformaTanim(item.tanim) || item.tanim,
            eslesen_urun: dto,
            eslesen_skor: Math.max(guven, 0.88),
            birim_fiyat_eur: birim,
            toplam_eur:
              birim != null ? Math.round(birim * item.adet * 100) / 100 : null,
            not_found: false,
          },
        };
      }
    }
  }

  const sorgu = buildMeiliSearchQuery(item);
  let hits = await searchCatalogForProforma(sorgu, 8);

  if (isCalismaTezgahiReferansIsim(item.tanim, item.olcu)) {
    const equstoSku = generateEqustoTezgahSku(item.tanim, item.olcu);
    if (equstoSku) {
      const skuHits = await searchCatalogForProforma(equstoSku, 6);
      const pimakSku = equstoSku.replace(/^EQUSTO\./i, "PIMAK.");
      const pimakHits = await searchCatalogForProforma(pimakSku, 4);
      const oztiSku = `7911.${equstoSku.replace(/^EQUSTO\./i, "")}`;
      const oztiHits = await searchCatalogForProforma(oztiSku, 4);
      const seen = new Set(hits.map((h) => h.id));
      for (const h of [...skuHits, ...pimakHits, ...oztiHits]) {
        if (h.id && !seen.has(h.id)) {
          hits.push(h);
          seen.add(h.id);
        }
      }
      if (!skuHits.some((h) => normSku(h.sku) === normSku(equstoSku))) {
        hits.unshift({
          id: `equsto-tezgah-${equstoSku.toLowerCase()}`,
          name: cleanProformaTanim(item.tanim),
          sku: equstoSku,
          brand: "Pimak",
          category: "tezgah",
          dept: "tezgah",
          specs: item.tanim,
          image: "",
          slug: "",
          satis_eur_indirimli: 0,
          liste_fiyati_eur: 0,
        } as CatalogSearchHit);
      }
    }
  }

  if (!requiresShelvedTezgah(item.tanim)) {
    const oztiSku = guessOztiSkuFromOlcu(item.olcu);
    if (oztiSku) {
      const skuHits = await searchCatalogForProforma(oztiSku, 4);
      const seen = new Set(hits.map((h) => h.id));
      for (const h of skuHits) {
        if (h.id && !seen.has(h.id)) hits.push(h);
      }
    }
  }

  if (requiresShelvedTezgah(item.tanim)) {
    const equstoSku = guessEqustoTezgahSkuFromOlcu(item.olcu, item.tanim);
    const extraQueries = [
      `${sorgu} ara raflı taban raf`,
      equstoSku,
    ].filter(Boolean) as string[];
    const seen = new Set(hits.map((h) => h.id));
    for (const q of extraQueries) {
      const rafHits = await searchCatalogForProforma(q, 8);
      for (const h of rafHits) {
        if (h.id && !seen.has(h.id)) {
          hits.push(h);
          seen.add(h.id);
        }
      }
    }
  }

  if (requiresTrolley(item.tanim)) {
    const gnMatch = foldTr(item.tanim).match(/(\d+)\s*x?\s*gn/i);
    const gnHint = gnMatch ? `${gnMatch[1]} GN banket` : "";
    const trolleyQueries = [
      "sıcak banket arabası GN 2/1 inoksan",
      gnHint,
      "banket servis arabası tepsi GN",
    ].filter(Boolean);
    const seen = new Set(hits.map((h) => h.id));
    for (const q of trolleyQueries) {
      const trolleyHits = await searchCatalogForProforma(q, 8);
      for (const h of trolleyHits) {
        if (h.id && !seen.has(h.id)) {
          hits.push(h);
          seen.add(h.id);
        }
      }
    }
  }

  if (requiresDishwasher(item.tanim)) {
    const dwQueries = [
      sorgu,
      "bulaşık yıkama makinesi 500 tabak inoksan",
      "BYM052 bulaşık yıkama",
    ];
    const seen = new Set(hits.map((h) => h.id));
    for (const q of dwQueries) {
      const dwHits = await searchCatalogForProforma(q, 8);
      for (const h of dwHits) {
        if (h.id && !seen.has(h.id)) {
          hits.push(h);
          seen.add(h.id);
        }
      }
    }
  }

  const { hit: best, guven } = pickBestHit(item, hits);

  let bestHit = best;
  const equstoTezgahSku = isCalismaTezgahiReferansIsim(item.tanim, item.olcu)
    ? generateEqustoTezgahSku(item.tanim, item.olcu)
    : null;
  if (bestHit && equstoTezgahSku) {
    bestHit = {
      ...bestHit,
      sku: equstoTezgahSku,
      brand: "Pimak",
      name: cleanProformaTanim(item.tanim) || bestHit.name,
    };
  }

  if (!bestHit) {
    return {
      matched: {
        ...item,
        eslesen_urun: null,
        eslesen_skor: 0,
        birim_fiyat_eur: null,
        toplam_eur: null,
        not_found: true,
      },
      bestHit: null,
    };
  }

  const dto = hitToDto(bestHit);
  const birim = dto.satis_fiyati_eur > 0 ? dto.satis_fiyati_eur : null;

  return {
    bestHit,
    matched: {
      ...item,
      tanim: cleanProformaTanim(item.tanim) || item.tanim,
      eslesen_urun: dto,
      eslesen_skor: Math.round(guven * 100) / 100,
      birim_fiyat_eur: birim,
      toplam_eur: birim != null ? Math.round(birim * item.adet * 100) / 100 : null,
      not_found: false,
    },
  };
}

export async function matchItems(items: ParsedItem[]): Promise<ItemMatchResult[]> {
  return Promise.all(items.map(matchItem));
}

export async function eslestirProformaKalemler(
  kalemler: ParsedItem[],
): Promise<MeiliKalemEslestirme[]> {
  const results = await matchItems(kalemler);
  const out: MeiliKalemEslestirme[] = [];
  for (let i = 0; i < kalemler.length; i++) {
    const kalem = kalemler[i];
    const { matched, bestHit } = results[i];
    const urun = bestHit ? await hitToEslesmis(bestHit) : null;
    out.push({ kalem, matched, urun });
  }
  return out;
}
