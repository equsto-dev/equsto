import type { TeklifCatalogHit } from "./catalog-hit-to-satir";
import { ayniMarka, satirTipArama } from "./marka-sinif";
import { foldTr } from "@/lib/search-query";
import type { TeklifV14Satir } from "./teklif-v14.types";

function olcuSayilari(s: string): number[] {
  return [...String(s || "").matchAll(/(\d{2,5})/g)].map((m) => Number(m[1]));
}

function olcuMesafe(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 800;
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
  if (!ayniMarka(hit.brand, hedefMarka)) return -1;
  const tip = foldTr(satirTipArama(satir));
  const hay = hitMetin(hit);
  let score = 40;
  for (const tok of tip.split(/\s+/).filter((t) => t.length >= 3)) {
    if (hay.includes(tok)) score += 25;
  }
  const kay = foldTr(satir.tanim);
  for (const tok of ["setustu", "gazli", "elektrikli", "gozlu"]) {
    if (kay.includes(tok) && hay.includes(tok)) score += 8;
  }
  score -= Math.min(40, olcuMesafe(olcuSayilari(satir.olcu), olcuSayilari(hit.name + " " + (hit.model || ""))) / 20);
  if (Number(hit.satis_eur_indirimli) > 0) score += 4;
  return score;
}

export function pickBestMarkaMuadil(
  satir: TeklifV14Satir,
  hits: TeklifCatalogHit[],
  hedefMarka: string,
): TeklifCatalogHit | null {
  let best: TeklifCatalogHit | null = null;
  let bestScore = 20;
  for (const hit of hits) {
    const s = scoreMarkaMuadil(satir, hit, hedefMarka);
    if (s > bestScore) {
      bestScore = s;
      best = hit;
    }
  }
  return best;
}

export async function fetchMarkaMuadil(
  satir: TeklifV14Satir,
  hedefMarka: string,
): Promise<TeklifCatalogHit | null> {
  const tip = satirTipArama(satir);
  const olcu = String(satir.olcu || "").replace(/—/g, "").trim();
  const queries = [
    `${hedefMarka} ${tip} ${olcu}`.trim(),
    `${hedefMarka} ${tip}`.trim(),
  ];
  for (const q of queries) {
    if (q.length < 3) continue;
    const res = await fetch(
      `/api/search?suggest=1&limit=12&q=${encodeURIComponent(q)}`,
      { cache: "no-store" },
    );
    if (!res.ok) continue;
    const body = (await res.json()) as { hits?: TeklifCatalogHit[] };
    const hit = pickBestMarkaMuadil(satir, Array.isArray(body.hits) ? body.hits : [], hedefMarka);
    if (hit) return hit;
  }
  return null;
}
