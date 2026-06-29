import { db } from "@/lib/db";
import { invalidatePfosFiyatKurallariCache } from "./fiyat-kurali";

export type PfosFiyatKuraliAdminRow = {
  id: string;
  kapsam: string;
  konsept_slug: string | null;
  liste_key: string | null;
  poz: string | null;
  urun_tipi: string | null;
  isim_kalibi: string | null;
  kural_tipi: string;
  carpan: number | null;
  baz_sku: string | null;
  sabit_fiyat_eur: number | null;
  aciklama: string | null;
  kaynak: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
};

function dec(v: { toString(): string } | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function fiyatKuraliToRow(r: {
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
  sabitFiyatEur: { toString(): string } | null;
  aciklama: string | null;
  kaynak: string;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PfosFiyatKuraliAdminRow {
  return {
    id: r.id,
    kapsam: r.kapsam,
    konsept_slug: r.konseptSlug,
    liste_key: r.listeKey,
    poz: r.poz,
    urun_tipi: r.urunTipi,
    isim_kalibi: r.isimKalibi,
    kural_tipi: r.kuralTipi,
    carpan: r.carpan,
    baz_sku: r.bazSku,
    sabit_fiyat_eur: dec(r.sabitFiyatEur),
    aciklama: r.aciklama,
    kaynak: r.kaynak,
    aktif: r.aktif,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  };
}

export async function listAllPfosFiyatKurallari(
  aktifOnly = false,
): Promise<PfosFiyatKuraliAdminRow[]> {
  const rows = await db.pfosFiyatKurali.findMany({
    where: aktifOnly ? { aktif: true } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
  return rows.map(fiyatKuraliToRow);
}

export type CreateFiyatKuraliInput = {
  kapsam?: string;
  konseptSlug?: string | null;
  listeKey?: string | null;
  poz?: string | null;
  urunTipi?: string | null;
  isimKalibi?: string | null;
  kuralTipi: string;
  carpan?: number | null;
  bazSku?: string | null;
  sabitFiyatEur?: number | null;
  aciklama?: string | null;
  kaynak?: string;
  aktif?: boolean;
};

export async function createPfosFiyatKurali(
  input: CreateFiyatKuraliInput,
): Promise<PfosFiyatKuraliAdminRow> {
  const kuralTipi = input.kuralTipi.trim();
  if (!kuralTipi) throw new Error("kuralTipi zorunlu");

  const row = await db.pfosFiyatKurali.create({
    data: {
      kapsam: input.kapsam?.trim() || "global",
      konseptSlug: input.konseptSlug?.trim() || null,
      listeKey: input.listeKey?.trim() || null,
      poz: input.poz?.trim() || null,
      urunTipi: input.urunTipi?.trim() || null,
      isimKalibi: input.isimKalibi?.trim() || null,
      kuralTipi,
      carpan: input.carpan ?? null,
      bazSku: input.bazSku?.trim() || null,
      sabitFiyatEur: input.sabitFiyatEur ?? null,
      aciklama: input.aciklama?.trim() || null,
      kaynak: input.kaynak?.trim() || "manual",
      aktif: input.aktif !== false,
    },
  });
  invalidatePfosFiyatKurallariCache();
  return fiyatKuraliToRow(row);
}

export async function updatePfosFiyatKurali(
  id: string,
  patch: Partial<CreateFiyatKuraliInput>,
): Promise<PfosFiyatKuraliAdminRow> {
  const row = await db.pfosFiyatKurali.update({
    where: { id },
    data: {
      ...(patch.kapsam != null ? { kapsam: patch.kapsam.trim() } : {}),
      ...(patch.konseptSlug !== undefined
        ? { konseptSlug: patch.konseptSlug?.trim() || null }
        : {}),
      ...(patch.listeKey !== undefined
        ? { listeKey: patch.listeKey?.trim() || null }
        : {}),
      ...(patch.poz !== undefined ? { poz: patch.poz?.trim() || null } : {}),
      ...(patch.urunTipi !== undefined
        ? { urunTipi: patch.urunTipi?.trim() || null }
        : {}),
      ...(patch.isimKalibi !== undefined
        ? { isimKalibi: patch.isimKalibi?.trim() || null }
        : {}),
      ...(patch.kuralTipi != null ? { kuralTipi: patch.kuralTipi.trim() } : {}),
      ...(patch.carpan !== undefined ? { carpan: patch.carpan } : {}),
      ...(patch.bazSku !== undefined ? { bazSku: patch.bazSku?.trim() || null } : {}),
      ...(patch.sabitFiyatEur !== undefined
        ? { sabitFiyatEur: patch.sabitFiyatEur }
        : {}),
      ...(patch.aciklama !== undefined
        ? { aciklama: patch.aciklama?.trim() || null }
        : {}),
      ...(patch.aktif !== undefined ? { aktif: !!patch.aktif } : {}),
    },
  });
  invalidatePfosFiyatKurallariCache();
  return fiyatKuraliToRow(row);
}
