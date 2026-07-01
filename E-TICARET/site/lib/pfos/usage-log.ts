import type { PfosUsageEvent } from "@/lib/prisma";
import { db } from "@/lib/db";

export type PfosUsageEventKind = "quote_generated" | "quote_sent";
export type PfosUsageSource = "wizard" | "liste";

export type PfosUsageLogInput = {
  event: PfosUsageEventKind;
  source: PfosUsageSource;
  konsept?: string;
  konseptLabel?: string;
  m2?: number | null;
  teklifSayi?: string;
  teklifRef?: string;
  kalemSayisi?: number;
  toplamTry?: number | null;
  toplamEur?: number | null;
  sehir?: string;
  memberLoggedIn?: boolean;
  memberId?: string | null;
  gonderimKanal?: string | null;
};

export type PfosUsageAdminRow = {
  id: string;
  event: string;
  source: string;
  konsept: string;
  konsept_label: string;
  m2: number | null;
  teklif_sayi: string;
  teklif_ref: string;
  kalem_sayisi: number;
  toplam_try: number | null;
  toplam_eur: number | null;
  sehir: string;
  member_logged_in: boolean;
  gonderim_kanal: string | null;
  created_at: string;
  /** teklif_sayi ile PfosFeedbackEvent join (Faz F) */
  feedback_vote?: string | null;
  feedback_guven?: number | null;
  feedback_durum?: string | null;
};

function dec(v: { toString(): string } | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function pfosUsageToAdmin(row: PfosUsageEvent): PfosUsageAdminRow {
  return {
    id: row.id,
    event: row.event,
    source: row.source,
    konsept: row.konsept,
    konsept_label: row.konseptLabel,
    m2: row.m2,
    teklif_sayi: row.teklifSayi,
    teklif_ref: row.teklifRef,
    kalem_sayisi: row.kalemSayisi,
    toplam_try: dec(row.toplamTry),
    toplam_eur: dec(row.toplamEur),
    sehir: row.sehir,
    member_logged_in: row.memberLoggedIn,
    gonderim_kanal: row.gonderimKanal,
    created_at: row.createdAt.toISOString(),
  };
}

export async function recordPfosUsageEvent(
  input: PfosUsageLogInput,
): Promise<PfosUsageAdminRow | null> {
  const event = input.event;
  const teklifSayi = String(input.teklifSayi ?? "").trim();

  if (event === "quote_generated" && teklifSayi) {
    const dup = await db.pfosUsageEvent.findFirst({
      where: { event: "quote_generated", teklifSayi },
      select: { id: true },
    });
    if (dup) return null;
  }

  const row = await db.pfosUsageEvent.create({
    data: {
      event,
      source: input.source || "",
      konsept: String(input.konsept ?? "").trim(),
      konseptLabel: String(input.konseptLabel ?? input.konsept ?? "").trim(),
      m2: input.m2 != null && Number.isFinite(input.m2) ? Math.round(input.m2) : null,
      teklifSayi,
      teklifRef: String(input.teklifRef ?? "").trim(),
      kalemSayisi: Math.max(0, Math.round(input.kalemSayisi ?? 0)),
      toplamTry: input.toplamTry ?? null,
      toplamEur: input.toplamEur ?? null,
      sehir: String(input.sehir ?? "").trim(),
      memberLoggedIn: !!input.memberLoggedIn,
      memberId: input.memberId?.trim() || null,
      gonderimKanal: input.gonderimKanal?.trim() || null,
    },
  });

  return pfosUsageToAdmin(row);
}

export async function pfosUsageOzet(days = 30) {
  const since = new Date(Date.now() - days * 86400000);

  const [uretildi, gonderildi, wizard, liste, uyeIle] = await Promise.all([
    db.pfosUsageEvent.count({
      where: { event: "quote_generated", createdAt: { gte: since } },
    }),
    db.pfosUsageEvent.count({
      where: { event: "quote_sent", createdAt: { gte: since } },
    }),
    db.pfosUsageEvent.count({
      where: { event: "quote_generated", source: "wizard", createdAt: { gte: since } },
    }),
    db.pfosUsageEvent.count({
      where: { event: "quote_generated", source: "liste", createdAt: { gte: since } },
    }),
    db.pfosUsageEvent.count({
      where: { event: "quote_generated", memberLoggedIn: true, createdAt: { gte: since } },
    }),
  ]);

  const donusum =
    uretildi > 0 ? Math.round((gonderildi / uretildi) * 1000) / 10 : 0;

  const [feedbackToplam, feedbackUp, feedbackDown, dusukGuvenDown] =
    await Promise.all([
      db.pfosFeedbackEvent.count({ where: { createdAt: { gte: since } } }),
      db.pfosFeedbackEvent.count({
        where: { vote: "up", createdAt: { gte: since } },
      }),
      db.pfosFeedbackEvent.count({
        where: { vote: "down", createdAt: { gte: since } },
      }),
      db.pfosFeedbackEvent.count({
        where: {
          vote: "down",
          guvenSkoru: { lt: 0.55 },
          createdAt: { gte: since },
        },
      }),
    ]);

  const oyToplam = feedbackUp + feedbackDown;
  const memnuniyet_yuzde =
    oyToplam > 0 ? Math.round((feedbackUp / oyToplam) * 1000) / 10 : null;

  return {
    days,
    uretildi,
    gonderildi,
    wizard,
    liste,
    uye_ile: uyeIle,
    anonim: Math.max(0, uretildi - uyeIle),
    donusum_yuzde: donusum,
    feedback_toplam: feedbackToplam,
    feedback_up: feedbackUp,
    feedback_down: feedbackDown,
    dusuk_guven_down: dusukGuvenDown,
    memnuniyet_yuzde,
  };
}

export async function listPfosUsageEvents(limit = 200, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await db.pfosUsageEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 2000),
  });
  return rows.map(pfosUsageToAdmin);
}

/** Kullanım satırları + teklif_sayi ile geri bildirim join */
export async function listPfosUsageEventsWithFeedback(
  limit = 200,
  days = 30,
): Promise<PfosUsageAdminRow[]> {
  const rows = await listPfosUsageEvents(limit, days);
  const sayilar = [
    ...new Set(rows.map((r) => r.teklif_sayi.trim()).filter(Boolean)),
  ];
  if (sayilar.length === 0) return rows;

  const feedbacks = await db.pfosFeedbackEvent.findMany({
    where: { teklifSayi: { in: sayilar } },
    orderBy: { createdAt: "desc" },
  });

  const fbByTeklif = new Map<
    string,
    { vote: string; guven: number | null; durum: string }
  >();
  for (const f of feedbacks) {
    const key = f.teklifSayi.trim();
    if (!key || fbByTeklif.has(key)) continue;
    fbByTeklif.set(key, {
      vote: f.vote,
      guven: f.guvenSkoru,
      durum: f.durum,
    });
  }

  return rows.map((r) => {
    const fb = r.teklif_sayi.trim() ? fbByTeklif.get(r.teklif_sayi.trim()) : null;
    return {
      ...r,
      feedback_vote: fb?.vote ?? null,
      feedback_guven: fb?.guven ?? null,
      feedback_durum: fb?.durum ?? null,
    };
  });
}
