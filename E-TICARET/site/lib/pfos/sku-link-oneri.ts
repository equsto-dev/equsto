import type { PfosSkuLinkOneri } from "@/lib/prisma";
import { db } from "@/lib/db";
import { referansLinkKey } from "./referans/sku-link-key";
import {
  invalidateDbReferansSkuLinksCache,
  upsertReferansSkuLink,
} from "./referans/sku-link-db";
import { invalidateReferansSkuLinksCache } from "./referans/referans-eslestirme";
import { invalidatePfosFiyatKurallariCache } from "./fiyat-kurali";
import {
  PFOS_SORUN_TIPLERI,
  type PfosSorunTipi,
} from "./feedback-types";

export type PfosSkuLinkOneriRow = {
  id: string;
  feedback_id: string | null;
  link_key: string;
  liste_key: string;
  poz: string;
  eski_sku: string | null;
  eski_ad: string | null;
  yeni_sku: string;
  yeni_ad: string | null;
  yeni_marka: string | null;
  sorun_tipi: string;
  durum: string;
  onaylayan: string | null;
  onay_notu: string | null;
  created_at: string;
  resolved_at: string | null;
};

function isSorunTipi(v: string): v is PfosSorunTipi {
  return (PFOS_SORUN_TIPLERI as readonly string[]).includes(v);
}

export function oneriToRow(row: PfosSkuLinkOneri): PfosSkuLinkOneriRow {
  return {
    id: row.id,
    feedback_id: row.feedbackId,
    link_key: row.linkKey,
    liste_key: row.listeKey,
    poz: row.poz,
    eski_sku: row.eskiSku,
    eski_ad: row.eskiAd,
    yeni_sku: row.yeniSku,
    yeni_ad: row.yeniAd,
    yeni_marka: row.yeniMarka,
    sorun_tipi: row.sorunTipi,
    durum: row.durum,
    onaylayan: row.onaylayan,
    onay_notu: row.onayNotu,
    created_at: row.createdAt.toISOString(),
    resolved_at: row.resolvedAt?.toISOString() ?? null,
  };
}

export async function listPfosSkuLinkOneri(opts?: {
  durum?: string;
  listeKey?: string;
  feedbackId?: string;
  limit?: number;
}): Promise<PfosSkuLinkOneriRow[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500);
  const rows = await db.pfosSkuLinkOneri.findMany({
    where: {
      ...(opts?.durum ? { durum: opts.durum } : {}),
      ...(opts?.listeKey ? { listeKey: opts.listeKey.trim().toLowerCase() } : {}),
      ...(opts?.feedbackId ? { feedbackId: opts.feedbackId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(oneriToRow);
}

export type CreateSkuLinkOneriInput = {
  listeKey: string;
  poz: string;
  yeniSku: string;
  yeniAd?: string | null;
  yeniMarka?: string | null;
  eskiSku?: string | null;
  eskiAd?: string | null;
  sorunTipi?: string;
  onayNotu?: string | null;
  feedbackId?: string | null;
};

export async function createPfosSkuLinkOneri(
  input: CreateSkuLinkOneriInput,
): Promise<PfosSkuLinkOneriRow> {
  const listeKey = input.listeKey.trim().toLowerCase();
  const poz = input.poz.trim().toUpperCase();
  const yeniSku = input.yeniSku.trim();
  if (!listeKey || !poz || !yeniSku) {
    throw new Error("listeKey, poz ve yeniSku zorunlu");
  }

  const sorunTipi = isSorunTipi(String(input.sorunTipi ?? ""))
    ? (input.sorunTipi as PfosSorunTipi)
    : "genel";

  const row = await db.pfosSkuLinkOneri.create({
    data: {
      feedbackId: input.feedbackId?.trim() || null,
      linkKey: referansLinkKey(listeKey, poz),
      listeKey,
      poz,
      eskiSku: input.eskiSku?.trim() || null,
      eskiAd: input.eskiAd?.trim() || null,
      yeniSku,
      yeniAd: input.yeniAd?.trim() || null,
      yeniMarka: input.yeniMarka?.trim() || null,
      sorunTipi,
      onayNotu: input.onayNotu?.trim() || null,
      durum: "pending",
    },
  });
  return oneriToRow(row);
}

async function maybeMarkFeedbackReviewed(
  feedbackId: string | null,
  reviewedBy: string,
): Promise<void> {
  if (!feedbackId) return;
  const pending = await db.pfosSkuLinkOneri.count({
    where: { feedbackId, durum: "pending" },
  });
  if (pending > 0) return;
  await db.pfosFeedbackEvent.update({
    where: { id: feedbackId },
    data: {
      durum: "reviewed",
      reviewedAt: new Date(),
      reviewedBy,
    },
  });
}

export async function approvePfosSkuLinkOneri(
  id: string,
  opts?: {
    onaylayan?: string | null;
    yeniSku?: string | null;
    yeniAd?: string | null;
    yeniMarka?: string | null;
    onayNotu?: string | null;
  },
): Promise<PfosSkuLinkOneriRow> {
  const onaylayan = opts?.onaylayan?.trim() || "admin";
  const existing = await db.pfosSkuLinkOneri.findUnique({ where: { id } });
  if (!existing) throw new Error("Öneri bulunamadı");
  if (existing.durum !== "pending") throw new Error("Öneri zaten işlendi");

  const yeniSku = (opts?.yeniSku ?? existing.yeniSku).trim();
  const yeniAd = (opts?.yeniAd ?? existing.yeniAd)?.trim() || null;
  const yeniMarka = (opts?.yeniMarka ?? existing.yeniMarka)?.trim() || null;

  if (existing.sorunTipi !== "fiyat_kurali" && !yeniSku) {
    throw new Error("Onay için yeniSku gerekli");
  }

  const row = await db.$transaction(async (tx) => {
    const updated = await tx.pfosSkuLinkOneri.update({
      where: { id },
      data: {
        durum: "approved",
        onaylayan,
        onayNotu: opts?.onayNotu?.trim() || existing.onayNotu,
        yeniSku: yeniSku || existing.yeniSku,
        yeniAd,
        yeniMarka,
        resolvedAt: new Date(),
      },
    });

    if (updated.sorunTipi === "fiyat_kurali") {
      await tx.pfosFiyatKurali.create({
        data: {
          kapsam: updated.listeKey ? "liste_key" : "global",
          listeKey: updated.listeKey || null,
          poz: updated.poz || null,
          isimKalibi: updated.eskiAd?.slice(0, 120) || null,
          kuralTipi: "carp",
          carpan: 4,
          aciklama: updated.onayNotu || `Geri bildirim önerisi ${updated.id}`,
          kaynak: "feedback",
          onaylayan,
          aktif: true,
        },
      });
    } else {
      await upsertReferansSkuLink({
        listeKey: updated.listeKey,
        poz: updated.poz,
        sku: yeniSku,
        name: yeniAd,
        marka: yeniMarka,
        kaynak: "feedback",
        oneriId: updated.id,
        onaylayan,
      });
    }

    return updated;
  });

  invalidateDbReferansSkuLinksCache();
  invalidateReferansSkuLinksCache();
  invalidatePfosFiyatKurallariCache();
  await maybeMarkFeedbackReviewed(row.feedbackId, onaylayan);

  return oneriToRow(row);
}

export async function rejectPfosSkuLinkOneri(
  id: string,
  onayNotu: string,
  onaylayan?: string | null,
): Promise<PfosSkuLinkOneriRow> {
  const note = onayNotu.trim();
  if (!note) throw new Error("Red notu zorunlu");

  const existing = await db.pfosSkuLinkOneri.findUnique({ where: { id } });
  if (!existing) throw new Error("Öneri bulunamadı");
  if (existing.durum !== "pending") throw new Error("Öneri zaten işlendi");

  const reviewer = onaylayan?.trim() || "admin";
  const row = await db.pfosSkuLinkOneri.update({
    where: { id },
    data: {
      durum: "rejected",
      onaylayan: reviewer,
      onayNotu: note,
      resolvedAt: new Date(),
    },
  });

  await maybeMarkFeedbackReviewed(row.feedbackId, reviewer);
  return oneriToRow(row);
}

export async function pfosEslesmeOzet(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const [pendingFeedback, pendingOneri, approvedLinks, downCount] =
    await Promise.all([
      db.pfosFeedbackEvent.count({
        where: { durum: "pending_review", createdAt: { gte: since } },
      }),
      db.pfosSkuLinkOneri.count({
        where: { durum: "pending", createdAt: { gte: since } },
      }),
      db.pfosReferansSkuLink.count({
        where: { createdAt: { gte: since } },
      }),
      db.pfosFeedbackEvent.count({
        where: { vote: "down", createdAt: { gte: since } },
      }),
    ]);

  return {
    days,
    pending_feedback: pendingFeedback,
    pending_oneri: pendingOneri,
    approved_links_month: approvedLinks,
    down_count: downCount,
  };
}
