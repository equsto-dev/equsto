import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import {
  CAGLAYAN_MARKA,
  isCaglayanKatalogMarka,
  isCaglayanTeshirRow,
  isEtTeshirReyonReferans,
  isPastaDolabiReferans,
} from "../core/caglayan-marka";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTeshirReyonReferans(isim: string): boolean {
  const n = norm(isim);
  return /teshir|teşhir|vitrin|reyon|mostra/.test(n);
}

function dimsFromOlcu(olcu: string): [number, number, number] | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 3) {
    if (nums.length === 2) return [nums[0], nums[1], 0];
    return null;
  }
  const scaled = nums.slice(0, 3).map((n) => (n < 900 ? Math.round(n * 10) : Math.round(n)));
  return [scaled[0], scaled[1], scaled[2]];
}

function dimsFromCaglayanName(ad: string): [number, number, number] | null {
  const m = String(ad).match(/(\d{3,4})\s*[×xX*]\s*(\d{3,4})\s*[×xX*]\s*(\d{3,4})/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function sortedTriple(d: [number, number, number]): [number, number, number] {
  return [...d].sort((a, b) => b - a) as [number, number, number];
}

function olcuDistance(
  target: [number, number, number],
  catalog: [number, number, number],
): number {
  const t = sortedTriple(target);
  const c = sortedTriple(catalog);
  return Math.abs(t[0] - c[0]) + Math.abs(t[1] - c[1]) + Math.abs(t[2] - c[2]);
}

function seriesBoost(category: string | null | undefined, isim: string): number {
  const cat = norm(String(category ?? ""));
  const n = norm(isim);
  let score = 0;

  const meatSeries = [
    "acelya",
    "gardenya",
    "anemon",
    "fulya",
    "hercai",
    "orkide",
    "sardunya",
    "lale",
  ];
  const pastrySeries = ["krizantem", "begonvil", "iris", "defne", "inci", "itir"];

  if (isPastaDolabiReferans(isim)) {
    if (cat.includes("yasemin")) score += 95;
    const blob = `${cat} ${norm(String(category ?? ""))}`;
    if (blob.includes("yasemin") && blob.includes("cl")) score += 30;
  }
  if (isEtTeshirReyonReferans(isim) || /kasap|sarkuteri|et\s*teshir/.test(n)) {
    for (const s of meatSeries) {
      if (cat.includes(s)) score += 45;
    }
  }
  if (/pastane|pasta|tatli|tatlı|borek|börek|kurabiye/.test(n) && !isPastaDolabiReferans(isim)) {
    for (const s of pastrySeries) {
      if (cat.includes(s)) score += 35;
    }
  }
  if (/motoru\s*disar|motoru\s*dışar|remote/.test(n) && /gl-|lm-/.test(cat)) {
    score += 20;
  }
  return score;
}

function pastaDolabiTieBreak(row: AdminUrunRow): number {
  const blob = norm(`${row.sku ?? ""} ${row.ad ?? ""} ${row.kategori ?? ""}`);
  let score = 0;
  if (blob.includes("yasemin") && blob.includes("cl")) score += 12;
  if (blob.includes("1600")) score += 6;
  if (blob.includes("1300")) score += 3;
  return score;
}

function scoreCaglayanRow(
  row: AdminUrunRow,
  target: [number, number, number] | null,
  isim: string,
): number {
  if (!isCaglayanTeshirRow(row)) return -9999;
  const catDims = dimsFromCaglayanName(row.ad);
  if (!catDims) return -9999;

  let score = 100;
  if (isCaglayanKatalogMarka(row.marka_ad)) score += 40;
  if (target) {
    const dist = olcuDistance(target, catDims);
    score += Math.max(0, 1200 - dist);
  }
  score += seriesBoost(row.kategori, isim);
  if (isPastaDolabiReferans(isim)) score += pastaDolabiTieBreak(row);
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

/** Teşhir reyonu / vitrin — Çağlayan Soğutma katalog; Öztiryakiler TSV kullanılmaz */
export async function matchTeshirReyonByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);
  const target = dimsFromOlcu(olcu);

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && isCaglayanTeshirRow(r),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreCaglayanRow(row, target, isim),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: CAGLAYAN_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: CAGLAYAN_MARKA,
      olcu: olcuDisplay,
      fiyat: scored[0].row.fiyat_tl > 0 ? scored[0].row.fiyat_tl : 0,
      fiyatEur: scored[0].row.fiyat_tl > 0 ? matched.fiyatEur : null,
    };
  }

  if (isTeshirReyonReferans(isim)) {
    return {
      id: `caglayan-teshir-${norm(isim).replace(/\s+/g, "-").slice(0, 48)}`,
      sku: null,
      ad: displayIsimFromSablon(isim),
      marka: CAGLAYAN_MARKA,
      model: null,
      olcu: olcuDisplay,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  return null;
}
