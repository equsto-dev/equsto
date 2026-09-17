import type { TeklifCatalogHit } from "./catalog-hit-to-satir";
import {
  ayniMarka,
  espressoGrupSayisi,
  satirTipArama,
} from "./marka-sinif";
import { foldTr } from "@/lib/search-query";
import type { TeklifV14Satir } from "./teklif-v14.types";

function olcuSayilari(s: string): number[] {
  return [...String(s || "").matchAll(/(\d{2,5})/g)].map((m) => Number(m[1]));
}

function olcuMesafe(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const n = Math.min(a.length, b.length);
  let d = 0;
  for (let i = 0; i < n; i++) d += Math.abs(a[i] - b[i]);
  return d;
}

function hitMetin(hit: TeklifCatalogHit): string {
  return foldTr([hit.name, hit.sku, hit.model, hit.specs].filter(Boolean).join(" "));
}

export function scoreMarkaMuadil(
  satir: TeklifV14Satir,
  hit: TeklifCatalogHit,
  hedefMarka: string,
): number {
  if (!ayniMarka(hit.brand, hedefMarka) && !foldTr(hit.brand).includes(foldTr(hedefMarka))) {
    return -1;
  }
  const tip = foldTr(satirTipArama(satir));
  const hay = hitMetin(hit);
  const kay = foldTr([satir.tanim, satir.aciklama].filter(Boolean).join(" "));
  let score = 50;
  for (const tok of tip.split(/\s+/).filter((t) => t.length >= 3)) {
    if (hay.includes(tok)) score += 30;
  }
  const kaynakGrup = espressoGrupSayisi(kay);
  const hitGrup = espressoGrupSayisi(hay);
  if (kaynakGrup != null && hitGrup != null) {
    score += kaynakGrup === hitGrup ? 80 : -40;
  }
  for (const tok of ["tam otomatik", "yari otomatik", "full otomatik", "setustu", "gazli", "elektrikli"]) {
    if (kay.includes(tok) && hay.includes(tok)) score += 12;
  }
  score -= Math.min(15, olcuMesafe(olcuSayilari(satir.olcu), olcuSayilari(hit.name + " " + (hit.model || ""))) / 40);
  if (Number(hit.satis_eur_indirimli) > 0) score += 4;
  return score;
}

export function pickBestMarkaMuadil(
  satir: TeklifV14Satir,
  hits: TeklifCatalogHit[],
  hedefMarka: string,
): TeklifCatalogHit | null {
  const ranked = rankMarkaMuadil(satir, hits, hedefMarka);
  return ranked[0] ?? null;
}

export function rankMarkaMuadil(
  satir: TeklifV14Satir,
  hits: TeklifCatalogHit[],
  hedefMarka: string,
): TeklifCatalogHit[] {
  return hits
    .map((hit) => ({ hit, score: scoreMarkaMuadil(satir, hit, hedefMarka) }))
    .filter((x) => x.score >= 50)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.hit)
    .filter((hit, i, all) => all.findIndex((h) => h.sku === hit.sku) === i)
    .slice(0, 8);
}

async function searchHits(q: string): Promise<TeklifCatalogHit[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(q)}&limit=24`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { hits?: TeklifCatalogHit[] };
  return Array.isArray(body.hits) ? body.hits : [];
}

export async function fetchMarkaAdaylari(
  satir: TeklifV14Satir,
  hedefMarka: string,
): Promise<TeklifCatalogHit[]> {
  const tip = satirTipArama(satir);
  const queries = [`${hedefMarka} ${tip}`, `${hedefMarka} espresso`, hedefMarka];
  const seen = new Set<string>();
  const pool: TeklifCatalogHit[] = [];
  for (const q of queries) {
    const hits = await searchHits(q);
    for (const hit of hits) {
      const key = hit.sku || hit.name;
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(hit);
    }
    const ranked = rankMarkaMuadil(satir, pool, hedefMarka);
    if (ranked.length >= 3) return ranked;
  }
  return rankMarkaMuadil(satir, pool, hedefMarka);
}

export async function fetchMarkaMuadil(
  satir: TeklifV14Satir,
  hedefMarka: string,
): Promise<TeklifCatalogHit | null> {
  const adaylar = await fetchMarkaAdaylari(satir, hedefMarka);
  return adaylar[0] ?? null;
}
