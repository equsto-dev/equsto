"use client";

import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";

const savedSnapshots = new Set<string>();

function snapshotKalemler(model: TeklifModelV14) {
  const byPoz = new Map(
    model.satirlar.filter((s) => s.poz.trim()).map((s) => [s.poz.trim(), s]),
  );
  if (model.pfos?.kalemler?.length) {
    return model.pfos.kalemler.map((k) => {
      const satir = byPoz.get(String(k.poz ?? "").trim());
      return {
        ...k,
        tanim: satir?.tanim ?? k.isim,
        stokNo: satir?.stokNo ?? k.sku,
        marka: satir?.marka ?? k.marka,
        olcu: satir?.olcu,
        adet: satir?.adet,
        birimSatis: satir?.birimSatis,
        toplamSatis: satir?.toplamSatis,
        doviz: satir?.doviz,
        bolumNo: satir?.bolumNo,
        bolumBaslik: satir?.bolumBaslik,
        elkKw: satir?.elkKw,
        gazKw: satir?.gazKw,
        aciklama: satir?.aciklama,
        fotoUrl: satir?.fotoUrl,
        fotoNot: satir?.fotoNot,
      };
    });
  }
  return model.satirlar
    .filter((s) => s.poz.trim())
    .map((s) => ({
      poz: s.poz,
      isim: s.tanim,
      sku: s.stokNo || null,
      ad: s.tanim,
      marka: s.marka || null,
      tanim: s.tanim,
      stokNo: s.stokNo,
      olcu: s.olcu,
      adet: s.adet,
      birimSatis: s.birimSatis,
      toplamSatis: s.toplamSatis,
      doviz: s.doviz,
      bolumNo: s.bolumNo,
      bolumBaslik: s.bolumBaslik,
      elkKw: s.elkKw,
      gazKw: s.gazKw,
      aciklama: s.aciklama,
      fotoUrl: s.fotoUrl,
      fotoNot: s.fotoNot,
    }));
}

/** Teklif ekranı — anlık kalem + tam v14 model (Excel indirme). */
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
        requestJson: { teklif_v14: model },
        kaynakYuklemeId: model.meta.kaynakYuklemeId ?? null,
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
