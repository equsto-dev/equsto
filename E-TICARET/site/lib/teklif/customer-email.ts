import { sendResendEmail } from "@/lib/email/resend-send";
import { generateTeklifV14ExcelBuffer } from "@/lib/pfos/teklif/export-teklif-v14.server";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import type { TeklifAdminRow } from "@/lib/teklif";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

function parseTeklifV14(body: Record<string, unknown>): TeklifModelV14 | null {
  const raw = body.teklif_v14;
  if (!raw || typeof raw !== "object") return null;
  const m = raw as TeklifModelV14;
  if (m.version !== "v14" || !m.ust || !Array.isArray(m.satirlar)) return null;
  return m;
}

export type TeklifCustomerEmailResult = {
  attempted: boolean;
  sent: boolean;
  error?: string;
};

/** PFOS teklifi — müşteriye Excel eki ile onay e-postası */
export async function sendTeklifCustomerEmail(
  teklif: TeklifAdminRow,
  body: Record<string, unknown>,
): Promise<TeklifCustomerEmailResult> {
  const mail = teklif.musteri_mail?.trim();
  if (!mail) {
    return { attempted: false, sent: false, error: "E-posta adresi yok" };
  }

  const model = parseTeklifV14(body);
  if (!model) {
    return { attempted: true, sent: false, error: "Teklif modeli eksik" };
  }

  const sayi = model.ust.sayi || teklif.ref_no;
  const filename = `equsto-teklif-${sayi}.xlsx`.replace(/[^\w.-]+/g, "-");
  const genel =
    model.ozet.genelToplam != null
      ? `${model.ozet.genelToplam.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
        })} ${model.ozet.doviz}`
      : "—";

  let attachment: Buffer;
  try {
    attachment = await generateTeklifV14ExcelBuffer(model);
  } catch (e) {
    return {
      attempted: true,
      sent: false,
      error: e instanceof Error ? e.message : "Excel oluşturulamadı",
    };
  }

  const subject = `Equsto teklifiniz — ${teklif.ref_no}`;
  const text = [
    `Merhaba ${teklif.musteri_ad || ""},`.trim(),
    "",
    "Proje Fabrikası (PFOS) teklif talebiniz Equsto'ya ulaştı.",
    "",
    `Referans: ${teklif.ref_no}`,
    `Proje: ${model.ust.projeAdi || "—"}`,
    `Konsept: ${teklif.konsept || model.meta?.konseptLabel || "—"}`,
    `Tahmini toplam: ${genel} (KDV hariç)`,
    "",
    "Ekte Excel proforma dosyanız bulunmaktadır.",
    "Satış ekibimiz en kısa sürede sizinle iletişime geçecektir.",
    "",
    `Equsto — ${siteUrl()}`,
    `${siteUrl()}/contact`,
  ].join("\n");

  const html = `
    <p>Merhaba ${teklif.musteri_ad || ""},</p>
    <p>Proje Fabrikası (PFOS) teklif talebiniz <strong>Equsto</strong>'ya ulaştı.</p>
    <ul>
      <li><strong>Referans:</strong> ${teklif.ref_no}</li>
      <li><strong>Proje:</strong> ${model.ust.projeAdi || "—"}</li>
      <li><strong>Konsept:</strong> ${teklif.konsept || model.meta?.konseptLabel || "—"}</li>
      <li><strong>Tahmini toplam:</strong> ${genel} (KDV hariç)</li>
    </ul>
    <p>Ekte Excel proforma dosyanız vardır. Satış ekibimiz en kısa sürede dönüş yapacaktır.</p>
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
