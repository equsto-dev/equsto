"use client";

type TrackWindow = Window & {
  equstoTrackEvent?: (name: string, params?: Record<string, unknown>) => void;
  equstoTrackConversion?: (type: string, params?: Record<string, unknown>) => void;
};

function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    (window as TrackWindow).equstoTrackEvent?.(name, params);
  } catch {
    /* analytics optional */
  }
}

/** Wizard veya liste akışında teklif tablosu oluştu */
export function trackPfosQuoteGenerated(params: {
  source: "wizard" | "liste";
  teklifSayi: string;
  kalemSayisi: number;
  toplamTry?: number | null;
  konsept?: string;
}) {
  track("pfos_quote_generated", params);
  if (params.source === "wizard") {
    try {
      (window as TrackWindow).equstoTrackConversion?.("quote", {
        kaynak: "pfos-wizard",
        teklif: params.teklifSayi,
        kalem: params.kalemSayisi,
        value: params.toplamTry ?? undefined,
        currency: "TRY",
      });
    } catch {
      /* optional */
    }
  }
}

/** Liste dosyası başarıyla fiyatlandırıldı */
export function trackPfosListeUpload(params: {
  kind: "excel" | "pdf";
  kalemSayisi: number;
  fiyatlandi: number;
  fiyatsiz: number;
  dosyaAdi: string;
}) {
  track("pfos_liste_upload", params);
}

/** Fiyatsız kalem için WhatsApp CTA tıklaması */
export function trackPfosListeWhatsApp(params: {
  scope: "satir" | "toplu";
  poz?: string;
  fiyatsizSayi?: number;
  teklifSayi?: string;
}) {
  track("pfos_liste_whatsapp", params);
}
