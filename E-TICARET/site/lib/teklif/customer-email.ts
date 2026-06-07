import { sendResendEmail } from "@/lib/email/resend-send";
import { generateTeklifV14ExcelBuffer } from "@/lib/pfos/teklif/export-teklif-v14.server";
import { generateTeklifV14PdfBuffer } from "@/lib/pfos/teklif/export-teklif-v14-pdf.server";
import type { TeklifAdminRow } from "@/lib/teklif";
import {
  parseTeklifV14,
  teklifGenelToplamLabel,
  teklifPdfFilename,
} from "@/lib/teklif/parse-v14";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

export type TeklifDeliveryResult = {
  attempted: boolean;
  sent: boolean;
  error?: string;
};

/** PFOS teklifi — müşteriye PDF eki ile e-posta */
export async function sendTeklifCustomerEmail(
  teklif: TeklifAdminRow,
  body: Record<string, unknown>,
): Promise<TeklifDeliveryResult> {
  const mail = teklif.musteri_mail?.trim();
  if (!mail) {
    return { attempted: false, sent: false, error: "E-posta adresi yok" };
  }

  const model = parseTeklifV14(body);
  if (!model) {
    return { attempted: true, sent: false, error: "Teklif modeli eksik" };
  }

  const pdfFilename = teklifPdfFilename(model, teklif.ref_no);
  const genel = teklifGenelToplamLabel(model);

  let attachment: Buffer;
  let filename = pdfFilename;
  let attachmentKind: "pdf" | "xlsx" = "pdf";
  try {
    attachment = await generateTeklifV14PdfBuffer(model);
  } catch (pdfErr) {
    console.error("[teklif] PDF oluşturulamadı, Excel yedek:", pdfErr);
    try {
      attachment = await generateTeklifV14ExcelBuffer(model);
      filename = pdfFilename.replace(/\.pdf$/i, ".xlsx");
      attachmentKind = "xlsx";
    } catch (e) {
      return {
        attempted: true,
        sent: false,
        error: e instanceof Error ? e.message : "PDF oluşturulamadı",
      };
    }
  }

  const attachmentLabel = attachmentKind === "pdf" ? "PDF" : "Excel";

  const subject = `Equsto teklifiniz — ${teklif.ref_no}`;
  const text = [
    `Merhaba ${teklif.musteri_ad || ""},`.trim(),
    "",
    "Proje Fabrikası (PFOS) teklifiniz hazır.",
    "",
    `Referans: ${teklif.ref_no}`,
    `Proje: ${model.ust.projeAdi || "—"}`,
    `Konsept: ${teklif.konsept || model.meta?.konseptLabel || "—"}`,
    `Tahmini toplam: ${genel} (KDV hariç)`,
    "",
    `Ekte ${attachmentLabel} proforma dosyanız bulunmaktadır.`,
    "Satış ekibimiz en kısa sürede sizinle iletişime geçecektir.",
    "",
    `Equsto — ${siteUrl()}`,
  ].join("\n");

  const html = `
    <p>Merhaba ${teklif.musteri_ad || ""},</p>
    <p>Proje Fabrikası (PFOS) teklifiniz <strong>Equsto</strong> tarafından hazırlandı.</p>
    <ul>
      <li><strong>Referans:</strong> ${teklif.ref_no}</li>
      <li><strong>Proje:</strong> ${model.ust.projeAdi || "—"}</li>
      <li><strong>Konsept:</strong> ${teklif.konsept || model.meta?.konseptLabel || "—"}</li>
      <li><strong>Tahmini toplam:</strong> ${genel} (KDV hariç)</li>
    </ul>
    <p>Ekte ${attachmentLabel} proforma dosyanız vardır.</p>
    <p><a href="${siteUrl()}/contact">İletişim</a> · <a href="${siteUrl()}/pfos">PFOS</a></p>
  `.trim();

  const res = await sendResendEmail({
    to: mail,
    subject,
    text,
    html,
    attachments: [{ filename, content: attachment }],
  });

  if (res.ok) return { attempted: true, sent: true };
  if (res.skipped) {
    return { attempted: false, sent: false, error: "E-posta servisi yapılandırılmamış" };
  }
  return { attempted: true, sent: false, error: res.error };
}
