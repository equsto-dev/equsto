import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { formatTeklifDovizHucre } from "@/lib/pfos/teklif/format-v14";
import { sanitizeTeklifV14ModelForExport } from "@/lib/pfos/teklif/sanitize-teklif-v14-export";

export function parseTeklifV14(body: Record<string, unknown>): TeklifModelV14 | null {
  const raw = body.teklif_v14;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as TeklifModelV14;
  if (m.version !== "v14" || !m.ust || !Array.isArray(m.satirlar)) return null;
  return sanitizeTeklifV14ModelForExport(m);
}

export function teklifPdfFilename(model: TeklifModelV14, refNo: string): string {
  const sayi = model.ust.sayi || refNo;
  return `equsto-teklif-${sayi}.pdf`.replace(/[^\w.-]+/g, "-");
}

export function teklifGenelToplamLabel(model: TeklifModelV14): string {
  return formatTeklifDovizHucre(model.ozet.genelToplam, model.ozet.doviz, 2);
}
