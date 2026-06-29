import type { EslesmisUrun } from "./schemas/pfos.schema";
import { db } from "@/lib/db";

export type PfosFiyatKuraliContext = {
  konseptSlug?: string | null;
  listeKey?: string | null;
  poz?: string | null;
  urunTipi?: string | null;
  isim: string;
};

export type PfosFiyatKuraliRow = {
  id: string;
  kapsam: string;
  konseptSlug: string | null;
  listeKey: string | null;
  poz: string | null;
  urunTipi: string | null;
  isimKalibi: string | null;
  kuralTipi: string;
  carpan: number | null;
  bazSku: string | null;
  sabitFiyatEur: number | null;
  aciklama: string | null;
  aktif: boolean;
};

function dec(v: { toString(): string } | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normTr(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

/** Aktif fiyat kurallarını yükle (Faz B motor entegrasyonu için). */
export async function loadActivePfosFiyatKurallari(): Promise<PfosFiyatKuraliRow[]> {
  try {
    const rows = await db.pfosFiyatKurali.findMany({
      where: { aktif: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      kapsam: r.kapsam,
      konseptSlug: r.konseptSlug,
      listeKey: r.listeKey,
      poz: r.poz,
      urunTipi: r.urunTipi,
      isimKalibi: r.isimKalibi,
      kuralTipi: r.kuralTipi,
      carpan: r.carpan,
      bazSku: r.bazSku,
      sabitFiyatEur: dec(r.sabitFiyatEur),
      aciklama: r.aciklama,
      aktif: r.aktif,
    }));
  } catch {
    return [];
  }
}

function ruleMatches(ctx: PfosFiyatKuraliContext, rule: PfosFiyatKuraliRow): boolean {
  if (rule.kapsam === "konsept" && rule.konseptSlug) {
    if (normTr(ctx.konseptSlug ?? "") !== normTr(rule.konseptSlug)) return false;
  }
  if (rule.kapsam === "liste_key" && rule.listeKey) {
    if (normTr(ctx.listeKey ?? "") !== normTr(rule.listeKey)) return false;
  }
  if (rule.poz && normTr(ctx.poz ?? "") !== normTr(rule.poz)) return false;
  if (rule.urunTipi && normTr(ctx.urunTipi ?? "") !== normTr(rule.urunTipi)) return false;
  if (rule.isimKalibi) {
    const pat = normTr(rule.isimKalibi);
    if (!normTr(ctx.isim).includes(pat)) return false;
  }
  return true;
}

/** Eşleşmiş ürün fiyatına DB kurallarını uygula. */
export function applyPfosFiyatKurallari(
  urun: EslesmisUrun,
  ctx: PfosFiyatKuraliContext,
  rules: PfosFiyatKuraliRow[],
): EslesmisUrun {
  let out = urun;
  for (const rule of rules) {
    if (!ruleMatches(ctx, rule)) continue;
    if (rule.kuralTipi === "carp" && rule.carpan != null && rule.carpan !== 1) {
      out = {
        ...out,
        fiyat: out.fiyat * rule.carpan,
        fiyatEur:
          out.fiyatEur != null ? out.fiyatEur * rule.carpan : out.fiyatEur,
      };
      break;
    }
  }
  return out;
}
