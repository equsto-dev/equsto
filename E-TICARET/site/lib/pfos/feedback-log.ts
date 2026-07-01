import type {
  PfosFeedbackEvent,
  PfosSkuLinkOneri,
} from "@/lib/prisma";
import { db } from "@/lib/db";
import { referansLinkKey } from "./referans/sku-link-key";
import { oneriToRow } from "./sku-link-oneri";
import {
  type PfosFeedbackAdminRow,
  type PfosFeedbackDurum,
  type PfosFeedbackLogInput,
  type PfosKalemDuzeltme,
  type PfosSorunTipi,
  PFOS_SORUN_TIPLERI,
} from "./feedback-types";
import { sortPfosFeedbackByPriority } from "./feedback-priority";

export type {
  PfosFeedbackLogInput,
  PfosFeedbackAdminRow,
  PfosKalemDuzeltme,
} from "./feedback-types";

const DEDUP_MS = 24 * 60 * 60 * 1000;

function dec(v: { toString(): string } | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseKalemDuzeltmeleri(raw: unknown): PfosKalemDuzeltme[] | null {
  if (!Array.isArray(raw)) return null;
  const out: PfosKalemDuzeltme[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const poz = String(o.poz ?? "").trim();
    if (!poz) continue;
    const sorun = String(o.sorunTipi ?? o.sorun_tipi ?? "genel").trim();
    out.push({
      poz,
      referansIsim: o.referansIsim != null ? String(o.referansIsim) : undefined,
      yanlisSku: o.yanlisSku != null ? String(o.yanlisSku) : o.yanlis_sku != null ? String(o.yanlis_sku) : null,
      yanlisAd: o.yanlisAd != null ? String(o.yanlisAd) : o.yanlis_ad != null ? String(o.yanlis_ad) : null,
      dogruSku:
        o.dogruSku != null
          ? String(o.dogruSku)
          : o.dogru_sku != null
            ? String(o.dogru_sku)
            : null,
      sorunTipi: sorun,
      not: o.not != null ? String(o.not) : null,
    });
  }
  return out.length > 0 ? out : null;
}

export function pfosFeedbackToAdmin(
  row: PfosFeedbackEvent & { _count?: { oneriler: number } },
): PfosFeedbackAdminRow {
  return {
    id: row.id,
    vote: row.vote,
    source: row.source,
    teklif_sayi: row.teklifSayi,
    snapshot_id: row.snapshotId,
    konsept: row.konsept,
    konsept_label: row.konseptLabel,
    referans_id: row.referansId,
    referans_liste_key: row.referansListeKey,
    m2: row.m2,
    guven_skoru: row.guvenSkoru,
    genel_toplam_eur: dec(row.genelToplamEur),
    yorum: row.yorum,
    kalem_duzeltmeleri: parseKalemDuzeltmeleri(row.kalemDuzeltmeleri),
    member_logged_in: row.memberLoggedIn,
    durum: row.durum,
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
    reviewed_by: row.reviewedBy,
    created_at: row.createdAt.toISOString(),
    oneri_sayisi: row._count?.oneriler,
  };
}

function isSorunTipi(v: string): v is PfosSorunTipi {
  return (PFOS_SORUN_TIPLERI as readonly string[]).includes(v);
}

async function createOneriFromKalem(
  feedbackId: string,
  listeKey: string,
  kalem: PfosKalemDuzeltme,
): Promise<PfosSkuLinkOneri | null> {
  const sorunTipi = isSorunTipi(String(kalem.sorunTipi ?? ""))
    ? (kalem.sorunTipi as PfosSorunTipi)
    : "genel";

  if (sorunTipi === "fiyat_kurali") {
    return null;
  }

  const linkKey = referansLinkKey(listeKey, kalem.poz);
  return db.pfosSkuLinkOneri.create({
    data: {
      feedbackId,
      linkKey,
      listeKey: listeKey.trim().toLowerCase(),
      poz: kalem.poz.trim().toUpperCase(),
      eskiSku: kalem.yanlisSku?.trim() || null,
      eskiAd: kalem.yanlisAd?.trim() || kalem.referansIsim?.trim() || null,
      yeniSku: kalem.dogruSku?.trim() || "",
      sorunTipi,
      onayNotu: kalem.not?.trim() || null,
      durum: "pending",
    },
  });
}

export async function recordPfosFeedback(
  input: PfosFeedbackLogInput,
): Promise<{ row: PfosFeedbackAdminRow | null; deduped: boolean; oneriSayisi: number }> {
  const teklifSayi = String(input.teklifSayi ?? "").trim();
  const vote = input.vote;

  if (teklifSayi) {
    const since = new Date(Date.now() - DEDUP_MS);
    const dup = await db.pfosFeedbackEvent.findFirst({
      where: { teklifSayi, vote, createdAt: { gte: since } },
      select: { id: true },
    });
    if (dup) return { row: null, deduped: true, oneriSayisi: 0 };
  }

  const kalemDuzeltmeleri = input.kalemDuzeltmeleri ?? [];
  const listeKey =
    String(input.referansListeKey ?? "").trim() ||
    String(input.referansId ?? "").trim();

  const feedback = await db.pfosFeedbackEvent.create({
    data: {
      vote,
      source: input.source || "wizard",
      teklifSayi,
      snapshotId: input.snapshotId?.trim() || null,
      konsept: String(input.konsept ?? "").trim(),
      konseptLabel: String(input.konseptLabel ?? input.konsept ?? "").trim(),
      referansId: input.referansId?.trim() || null,
      referansListeKey: input.referansListeKey?.trim() || null,
      m2: input.m2 != null && Number.isFinite(input.m2) ? Math.round(input.m2) : null,
      guvenSkoru:
        input.guvenSkoru != null && Number.isFinite(input.guvenSkoru)
          ? input.guvenSkoru
          : null,
      genelToplamEur: input.genelToplamEur ?? null,
      yorum: input.yorum?.trim() || null,
      kalemDuzeltmeleri:
        kalemDuzeltmeleri.length > 0
          ? (kalemDuzeltmeleri as unknown as object)
          : undefined,
      memberLoggedIn: !!input.memberLoggedIn,
      memberId: input.memberId?.trim() || null,
      durum: vote === "down" ? "pending_review" : "reviewed",
      reviewedAt: vote === "up" ? new Date() : null,
    },
    include: { _count: { select: { oneriler: true } } },
  });

  let oneriSayisi = 0;
  if (vote === "down" && listeKey && kalemDuzeltmeleri.length > 0) {
    for (const kalem of kalemDuzeltmeleri.slice(0, 3)) {
      const oneri = await createOneriFromKalem(feedback.id, listeKey, kalem);
      if (oneri) oneriSayisi += 1;
    }
  }

  const withCount = await db.pfosFeedbackEvent.findUnique({
    where: { id: feedback.id },
    include: { _count: { select: { oneriler: true } } },
  });

  return {
    row: withCount ? pfosFeedbackToAdmin(withCount) : pfosFeedbackToAdmin(feedback),
    deduped: false,
    oneriSayisi,
  };
}

export async function listPfosFeedbackEvents(opts?: {
  durum?: PfosFeedbackDurum | string;
  vote?: string;
  konsept?: string;
  days?: number;
  limit?: number;
}): Promise<PfosFeedbackAdminRow[]> {
  const days = Math.min(Math.max(opts?.days ?? 30, 1), 365);
  const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 500);
  const since = new Date(Date.now() - days * 86400000);

  const rows = await db.pfosFeedbackEvent.findMany({
    where: {
      createdAt: { gte: since },
      ...(opts?.durum ? { durum: opts.durum } : {}),
      ...(opts?.vote ? { vote: opts.vote } : {}),
      ...(opts?.konsept ? { konsept: opts.konsept } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { _count: { select: { oneriler: true } } },
  });

  return sortPfosFeedbackByPriority(rows.map(pfosFeedbackToAdmin));
}

export async function getPfosFeedbackById(id: string) {
  const row = await db.pfosFeedbackEvent.findUnique({
    where: { id },
    include: {
      oneriler: { orderBy: { createdAt: "asc" } },
      snapshot: true,
      _count: { select: { oneriler: true } },
    },
  });
  if (!row) return null;
  return {
    feedback: pfosFeedbackToAdmin(row),
    oneriler: row.oneriler.map(oneriToRow),
    snapshot: row.snapshot,
  };
}

export async function updatePfosFeedbackDurum(
  id: string,
  durum: PfosFeedbackDurum,
  reviewedBy?: string | null,
) {
  const row = await db.pfosFeedbackEvent.update({
    where: { id },
    data: {
      durum,
      reviewedBy: reviewedBy?.trim() || null,
      reviewedAt: new Date(),
    },
    include: { _count: { select: { oneriler: true } } },
  });
  return pfosFeedbackToAdmin(row);
}

export async function pfosFeedbackOzet(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const [toplam, down, pending, oneri] = await Promise.all([
    db.pfosFeedbackEvent.count({ where: { createdAt: { gte: since } } }),
    db.pfosFeedbackEvent.count({
      where: { vote: "down", createdAt: { gte: since } },
    }),
    db.pfosFeedbackEvent.count({
      where: { durum: "pending_review", createdAt: { gte: since } },
    }),
    db.pfosSkuLinkOneri.count({
      where: { durum: "pending", createdAt: { gte: since } },
    }),
  ]);
  return { days, toplam, down, pending_review: pending, oneri_bekleyen: oneri };
}
