"use client";

import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { memberLoggedInNow } from "@/lib/pfos/member-session.client";
import type { PfosUsageLogInput, PfosUsageSource } from "@/lib/pfos/usage-log";
import { trackPfosQuoteGenerated } from "@/lib/pfos/track-pfos-analytics.client";

const loggedSayilar = new Set<string>();

function postUsage(payload: PfosUsageLogInput) {
  void fetch("/api/pfos/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* istatistik — sessiz */
  });
}

/** Teklif tablosu ekranda — anonim kullanım logu (PDF gönderilmeden). */
export function logPfosQuoteGenerated(
  model: TeklifModelV14,
  source: PfosUsageSource,
) {
  const teklifSayi = model.ust.sayi?.trim();
  if (!teklifSayi) return;
  const key = `gen:${teklifSayi}`;
  if (loggedSayilar.has(key)) return;
  loggedSayilar.add(key);

  const eurTry = model.ust.eurTry ?? 0;
  const genelEur = model.ozet.genelToplam ?? 0;
  const toplamTry =
    eurTry > 0 && genelEur > 0 ? Math.round(genelEur * eurTry) : null;

  postUsage({
    event: "quote_generated",
    source,
    konsept: model.meta.konsept,
    konseptLabel: model.meta.konseptLabel,
    m2: model.meta.m2Toplam || null,
    teklifSayi,
    kalemSayisi: model.satirlar.length,
    toplamTry,
    toplamEur: genelEur > 0 ? genelEur : null,
    sehir: model.meta.sehir,
    memberLoggedIn: memberLoggedInNow(),
  });

  trackPfosQuoteGenerated({
    source,
    teklifSayi,
    kalemSayisi: model.satirlar.length,
    toplamTry,
    konsept: model.meta.konsept,
  });
}
