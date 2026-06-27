import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";

export type WorkspaceMode = "wizard" | "liste";

export type ListePipelineStage =
  | "liste"
  | "eslestir"
  | "kontrol"
  | "fiyat"
  | "teklif";

export type WizardPipelineStage =
  | "konsept"
  | "teslimat"
  | "kapasite"
  | "teklif";

export type PipelineStageId = ListePipelineStage | WizardPipelineStage;

export type PipelineStep = {
  id: PipelineStageId;
  label: string;
};

export type LiveSummaryData = {
  projeAdi: string;
  urunSayisi: number;
  markaSayisi: number;
  kategoriSayisi: number;
  tahminiFiyat: number | null;
  doviz: "TRY" | "EUR" | "USD";
  eslesen: number;
  bekleyen: number;
  toplamZorunlu: number;
  guvenSkoru: number | null;
  wizardPct: number | null;
};

export function summaryFromPfos(
  sonuc: PFOSResponse,
  projeAdi?: string,
): LiveSummaryData {
  const kalemler = sonuc.kalemler ?? [];
  const markalar = new Set<string>();
  const kategoriler = new Set<string>();
  for (const k of kalemler) {
    if (k.urun?.marka?.trim()) markalar.add(k.urun.marka.trim());
    if (k.kategoriKodu?.trim()) kategoriler.add(k.kategoriKodu.trim());
  }
  const ozet = sonuc.ozet;
  const eslesen = ozet?.eslesmisZorunluSayisi ?? ozet?.eslesmeSayisi ?? 0;
  const toplamZorunlu = ozet?.zorunluKalemSayisi ?? ozet?.toplamKalemSayisi ?? 0;
  return {
    projeAdi: projeAdi ?? sonuc.konseptLabel ?? "Proje",
    urunSayisi: kalemler.length,
    markaSayisi: markalar.size,
    kategoriSayisi: kategoriler.size,
    tahminiFiyat: ozet?.toplamFiyat ?? null,
    doviz: ozet?.doviz ?? "TRY",
    eslesen,
    bekleyen: Math.max(0, toplamZorunlu - eslesen),
    toplamZorunlu,
    guvenSkoru: sonuc.guvenSkoru ?? null,
    wizardPct: null,
  };
}

export const LISTE_PIPELINE: PipelineStep[] = [
  { id: "liste", label: "Liste" },
  { id: "eslestir", label: "Eşleştir" },
  { id: "kontrol", label: "Kontrol" },
  { id: "fiyat", label: "Fiyat" },
  { id: "teklif", label: "Teklif" },
];

export const WIZARD_PIPELINE: PipelineStep[] = [
  { id: "konsept", label: "Konsept" },
  { id: "teslimat", label: "Teslimat" },
  { id: "kapasite", label: "Kapasite" },
  { id: "teklif", label: "Teklif" },
];
