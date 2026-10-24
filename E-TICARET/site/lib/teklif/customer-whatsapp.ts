import { generateTeklifV14PdfBuffer } from "@/lib/pfos/teklif/export-teklif-v14-pdf.server";
import type { TeklifAdminRow } from "@/lib/teklif";
import {
  parseTeklifV14,
  teklifGenelToplamLabel,
  teklifPdfFilename,
} from "@/lib/teklif/parse-v14";
import type { TeklifDeliveryResult } from "@/lib/teklif/customer-email";
import { sendWhatsAppDocument, whatsAppSendConfigured } from "@/lib/whatsapp/send";

function teklifWaCaption(
  teklif: TeklifAdminRow,
  model: NonNullable<ReturnType<typeof parseTeklifV14>>,
): string {
  const genel = teklifGenelToplamLabel(model);
  return [
    `Equsto PFOS teklifiniz — ${teklif.ref_no}`,
    model.ust.projeAdi ? `Proje: ${model.ust.projeAdi}` : "",
    teklif.konsept ? `Konsept: ${teklif.konsept}` : "",
    `Tahmini toplam: ${genel} (KDV hariç)`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1024);
}

/** PFOS teklifi — müşteriye WhatsApp PDF */
export async function sendTeklifCustomerWhatsApp(
  teklif: TeklifAdminRow,
  body: Record<string, unknown>,
): Promise<TeklifDeliveryResult> {
  const tel = teklif.musteri_tel?.trim();
  if (!tel) {
    return { attempted: false, sent: false, error: "Telefon numarası yok" };
  }

  if (!whatsAppSendConfigured()) {
    return {
      attempted: false,
      sent: false,
      error: "WhatsApp sunucu gönderimi yapılandırılmamış",
    };
  }

  const model = parseTeklifV14(body);
  if (!model) {
    return { attempted: true, sent: false, error: "Teklif modeli eksik" };
  }

  const filename = teklifPdfFilename(model, teklif.ref_no);
  let pdf: Buffer;
  try {
    pdf = await generateTeklifV14PdfBuffer(model);
  } catch (e) {
    return {
      attempted: true,
      sent: false,
      error: e instanceof Error ? e.message : "PDF oluşturulamadı",
    };
  }

  const caption = teklifWaCaption(teklif, model);
  const res = await sendWhatsAppDocument(tel, pdf, filename, caption);
  if (res.ok) return { attempted: true, sent: true };
  return { attempted: true, sent: false, error: res.error };
}
