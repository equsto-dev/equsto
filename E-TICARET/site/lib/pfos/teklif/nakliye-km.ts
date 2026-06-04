/**
 * İstanbul çıkış → montaj şehri karayolu km (pfos-sehir-km.json).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
export function normSehir(sehir: string | null | undefined): string {
  return String(sehir ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export type SehirKmConfig = {
  version: number;
  cikis: { sehir: string; lat: number; lng: number };
  yol_katsayi: number;
  km_by_sehir: Record<string, number>;
};

let kmCache: SehirKmConfig | null = null;

function kmPath(): string {
  return path.join(process.cwd(), "public/data/pfos-sehir-km.json");
}

export async function loadSehirKm(): Promise<SehirKmConfig> {
  if (kmCache) return kmCache;
  try {
    const raw = await readFile(kmPath(), "utf8");
    kmCache = JSON.parse(raw) as SehirKmConfig;
  } catch {
    kmCache = {
      version: 1,
      cikis: { sehir: "İstanbul", lat: 41.0082, lng: 28.9784 },
      yol_katsayi: 1.2,
      km_by_sehir: { İstanbul: 0 },
    };
  }
  return kmCache;
}

export type KmFromIstanbulSonuc = {
  km: number;
  gecerli: boolean;
  cikis: string;
  hedef: string;
};

export function lookupKmFromTable(
  sehir: string | null | undefined,
  table: Record<string, number>,
): number | null {
  const s = normSehir(sehir);
  if (!s) return null;
  if (table[s] != null) return table[s];
  const low = s.toLocaleLowerCase("tr-TR");
  for (const [name, km] of Object.entries(table)) {
    if (name.toLocaleLowerCase("tr-TR") === low) return km;
  }
  return null;
}

/** Tablodaki yol km; İstanbul = 0, bilinmeyen il = null */
export async function kmFromIstanbul(
  sehir: string | null | undefined,
): Promise<KmFromIstanbulSonuc> {
  const cfg = await loadSehirKm();
  const hedef = normSehir(sehir);
  if (!hedef) {
    return { km: 0, gecerli: false, cikis: cfg.cikis.sehir, hedef: "" };
  }
  const tablo = lookupKmFromTable(hedef, cfg.km_by_sehir);
  if (tablo == null) {
    return { km: 0, gecerli: false, cikis: cfg.cikis.sehir, hedef };
  }
  return {
    km: tablo,
    gecerli: true,
    cikis: cfg.cikis.sehir,
    hedef,
  };
}

/** Nakliye faturasında kullanılan etkin km (şehir içi taban mesafe dahil) */
export function effectiveNakliyeKm(
  tabloKm: number,
  minKm: number,
): number {
  if (tabloKm <= 0) return minKm;
  return Math.max(tabloKm, minKm);
}
