/**
 * PFOS m² dağıtım kuralları (Proje Fabrikası — /yonetim/pfos).
 *
 * 1. Toplam alanın 1/3'ü mutfak alanı olarak kabul edilir.
 * 2. Genel kural veya konsept istisnasındaki bölümlere oranlar uygulanır.
 * 3. Kuralda tanımlı olmayan bölümlere otomatik değer atanmaz — istisnalar
 *    PFOS_M2_KONSEPT_ORANLARI içine eklenecek.
 */

import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";

/** Genel kural — konsept istisnası yoksa uygulanır */
export const PFOS_M2_GENEL_ORANLARI: Readonly<Record<string, number>> = {
  ana_mutfak: 40,
  et_hazirlik: 10,
  sebze_hazirlik: 10,
  bulasikhane: 10,
  bar: 10,
  soguk_oda: 10,
  derin_dondurucu: 10,
  kuru_depo: 10,
};

/** Konsept bazlı istisnalar — genel kuralın yerine geçer (henüz tanımlı değil) */
export const PFOS_M2_KONSEPT_ORANLARI: Partial<
  Record<Konsept, Readonly<Record<string, number>>>
> = {};

export function oranlarForKonsept(
  konsept: Konsept | null | undefined,
): Readonly<Record<string, number>> {
  if (konsept && PFOS_M2_KONSEPT_ORANLARI[konsept]) {
    return PFOS_M2_KONSEPT_ORANLARI[konsept]!;
  }
  return PFOS_M2_GENEL_ORANLARI;
}

export function mutfakM2FromToplam(toplamAlan: number): number {
  if (!Number.isFinite(toplamAlan) || toplamAlan <= 0) return 0;
  return Math.round(toplamAlan / 3);
}

/** Tam sayı dağıtımında yuvarlama farkını en büyük kesirli paya ekler. */
function dagitTamSayi(
  hedefToplam: number,
  agirliklar: ReadonlyArray<{ key: string; weight: number }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (hedefToplam <= 0 || !agirliklar.length) return out;

  const weightSum = agirliklar.reduce((s, a) => s + a.weight, 0);
  if (weightSum <= 0) return out;

  const raw = agirliklar.map(({ key, weight }) => {
    const exact = (hedefToplam * weight) / weightSum;
    const base = Math.floor(exact);
    out[key] = base;
    return { key, frac: exact - base };
  });

  let kalan = hedefToplam - Object.values(out).reduce((s, v) => s + v, 0);
  raw.sort((a, b) => b.frac - a.frac);
  for (let i = 0; kalan > 0; i++) {
    const k = raw[i % raw.length].key;
    out[k] += 1;
    kalan -= 1;
  }

  return out;
}

/**
 * Toplam m² → konsept zone listesine tanımlı kurallara göre bölüm m² dağıtımı.
 * Yalnızca kuralda oranı olan ve konsept listesinde bulunan bölümler doldurulur.
 */
export function dagitM2ByKural(
  zones: string[],
  toplamAlan: number,
  konsept?: Konsept | null,
): Record<string, number> {
  if (!zones.length || toplamAlan <= 0) return {};

  const mutfakM2 = mutfakM2FromToplam(toplamAlan);
  const oranlar = oranlarForKonsept(konsept);

  const agirlikli = zones
    .filter((z) => oranlar[z] != null && oranlar[z]! > 0)
    .map((z) => ({ key: z, weight: oranlar[z]! }));

  if (!agirlikli.length) return {};

  return dagitTamSayi(mutfakM2, agirlikli);
}

/** @deprecated dagitM2ByKural kullanın */
export const dagitM2GenelKural = dagitM2ByKural;
