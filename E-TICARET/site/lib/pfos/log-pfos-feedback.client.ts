"use client";

import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { memberLoggedInNow } from "@/lib/pfos/member-session.client";
import type { PfosKalemDuzeltme } from "@/lib/pfos/feedback-types";

export type PfosFeedbackClientInput = {
  vote: "up" | "down";
  model: TeklifModelV14;
  source?: "wizard" | "liste";
  snapshotId?: string | null;
  yorum?: string | null;
  kalemDuzeltmeleri?: PfosKalemDuzeltme[];
};

export type PfosFeedbackClientResult = {
  ok: boolean;
  deduped?: boolean;
  error?: string;
};

export async function logPfosTeklifFeedback(
  input: PfosFeedbackClientInput,
): Promise<PfosFeedbackClientResult> {
  const { model, vote } = input;
  const teklifSayi = model.ust.sayi?.trim();
  if (!teklifSayi) return { ok: false, error: "teklif_sayi yok" };

  const genelEur = model.ozet.genelToplam ?? 0;
  const genelToplamEur = genelEur > 0 ? genelEur : null;

  try {
    const res = await fetch("/api/pfos/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vote,
        source: input.source ?? "wizard",
        teklifSayi,
        snapshotId: input.snapshotId ?? null,
        konsept: model.meta.konsept,
        konseptLabel: model.meta.konseptLabel,
        referansListeKey: model.pfos?.referansListeKey ?? null,
        m2: model.meta.m2Toplam || null,
        guvenSkoru: model.pfos?.guvenSkoru ?? null,
        genelToplamEur,
        yorum: input.yorum?.trim() || null,
        kalemDuzeltmeleri: input.kalemDuzeltmeleri ?? [],
        memberLoggedIn: memberLoggedInNow(),
      }),
      keepalive: true,
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      deduped?: boolean;
      error?: string;
    };
    if (!res.ok || !data.success) {
      return { ok: false, error: data.error ?? "Geri bildirim kaydedilemedi" };
    }
    return { ok: true, deduped: data.deduped };
  } catch {
    return { ok: false, error: "Ağ hatası" };
  }
}
