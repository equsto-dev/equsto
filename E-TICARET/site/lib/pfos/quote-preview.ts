import type { PFOSRequest, PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";

export type QuotePreviewMeta = {
  detaySeviyesi: "hizli" | "standart" | "detayli";
  kullanilanReferansId: string | null;
  eksikZorunlu: string[];
  tavsiyeKalemler: string[];
  onerilenDetaySeviyesi: "detayli" | null;
  neden: string[];
};

export function buildQuotePreviewMeta(
  response: PFOSResponse,
  request: PFOSRequest,
  kullanilanReferansId?: string | null,
): QuotePreviewMeta {
  const detaySeviyesi = request.detaySeviyesi ?? "standart";
  const eksikZorunlu = response.kalemler
    .filter((k) => k.tip === "zorunlu" && !k.urun)
    .map((k) => k.isim);
  const tavsiyeKalemler = response.kalemler
    .filter((k) => k.tip === "tavsiye")
    .map((k) => k.isim);

  const neden: string[] = [];
  let onerilenDetaySeviyesi: "detayli" | null = null;

  if (eksikZorunlu.length > 0) {
    onerilenDetaySeviyesi = "detayli";
    neden.push(
      `eksik zorunlu: ${eksikZorunlu.slice(0, 4).join(", ")}${eksikZorunlu.length > 4 ? "…" : ""}`,
    );
  }
  if (response.guvenSkoru < 0.5) {
    onerilenDetaySeviyesi = "detayli";
    neden.push("düşük güven skoru");
  }
  if (detaySeviyesi === "hizli" && eksikZorunlu.length > 2) {
    onerilenDetaySeviyesi = "detayli";
    if (!neden.some((n) => n.startsWith("eksik zorunlu"))) {
      neden.push("hızlı modda çok sayıda eşleşmeyen zorunlu kalem");
    }
  }

  const fromKalem = response.kalemler.find((k) => k.referansListeKey)?.referansListeKey;
  const resolvedReferansId =
    kullanilanReferansId?.trim() ||
    request.referansId?.trim() ||
    fromKalem ||
    null;

  return {
    detaySeviyesi,
    kullanilanReferansId: resolvedReferansId,
    eksikZorunlu,
    tavsiyeKalemler,
    onerilenDetaySeviyesi,
    neden,
  };
}

export type QuotePreviewResponse = {
  success: true;
  preview: QuotePreviewMeta;
  konsept: string;
  konseptLabel: string;
  m2: number;
  guvenSkoru: number;
  ozet: PFOSResponse["ozet"];
  uyarilar: string[];
};

export function buildQuotePreviewResponse(
  response: PFOSResponse,
  request: PFOSRequest,
  kullanilanReferansId?: string | null,
): QuotePreviewResponse {
  return {
    success: true,
    preview: buildQuotePreviewMeta(response, request, kullanilanReferansId),
    konsept: response.konsept,
    konseptLabel: response.konseptLabel,
    m2: response.m2,
    guvenSkoru: response.guvenSkoru,
    ozet: response.ozet,
    uyarilar: response.uyarilar,
  };
}
