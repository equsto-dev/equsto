"use client";

import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";

const savedSnapshots = new Set<string>();

function snapshotKalemler(model: TeklifModelV14) {
  if (model.pfos?.kalemler?.length) return model.pfos.kalemler;
  return model.satirlar
    .filter((s) => s.poz.trim())
    .map((s) => ({
      poz: s.poz,
      isim: s.tanim,
      sku: s.stokNo || null,
      ad: s.tanim,
      marka: s.marka || null,
    }));
}

/** Teklif ekranı — anlık kalem + meta snapshot (geri bildirim bağlamı). */
export async function savePfosTeklifSnapshot(
  model: TeklifModelV14,
): Promise<string | null> {
  const teklifSayi = model.ust.sayi?.trim();
  if (!teklifSayi || savedSnapshots.has(teklifSayi)) return null;

  try {
    const res = await fetch("/api/pfos/teklif-snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projeRef: teklifSayi,
        konsept: model.meta.konsept,
        referansListeKey: model.pfos?.referansListeKey ?? null,
        m2: model.meta.m2Toplam || null,
        guvenSkoru: model.pfos?.guvenSkoru ?? null,
        kalemler: snapshotKalemler(model),
      }),
      keepalive: true,
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      snapshotId?: string;
    };
    savedSnapshots.add(teklifSayi);
    if (data.success && data.snapshotId) return data.snapshotId;
  } catch {
    /* snapshot opsiyonel — sessiz */
  }
  savedSnapshots.add(teklifSayi);
  return null;
}
