import type { Musteri, Siparis } from "@/lib/prisma";
import { normalizeWaRecipient } from "@/lib/whatsapp/config";
import { buildWaMeUrl } from "@/lib/whatsapp/link";
import {
  sendWhatsAppText,
  whatsAppNotifyTo,
  whatsAppSendConfigured,
} from "@/lib/whatsapp";

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

function stripEnvQuotes(raw: string): string {
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** BotFather token — getUpdates URL veya KEY=value yapıştırmasını tolere eder. */
function telegramBotToken(): string {
  let raw = stripEnvQuotes(env("TELEGRAM_BOT_TOKEN"));
  if (!raw) return "";
  if (/^TELEGRAM_BOT_TOKEN=/i.test(raw)) {
    raw = raw.replace(/^TELEGRAM_BOT_TOKEN=/i, "").trim();
  }
  const fromUrl = raw.match(/\/bot([^/?#\s]+)/i);
  if (fromUrl) return fromUrl[1];
  if (/^https?:\/\//i.test(raw)) {
    return raw
      .replace(/^https?:\/\/api\.telegram\.org\/bot/i, "")
      .replace(/\/.*$/, "");
  }
  return raw;
}

function telegramChatId(): string {
  let raw = stripEnvQuotes(env("TELEGRAM_CHAT_ID"));
  if (!raw) return "";
  if (/^TELEGRAM_CHAT_ID=/i.test(raw)) {
    raw = raw.replace(/^TELEGRAM_CHAT_ID=/i, "").trim();
  }
  const m = raw.match(/^-?\d+/);
  return m ? m[0] : raw.replace(/\D/g, "");
}

function siteUrl(): string {
  return env("NEXT_PUBLIC_SITE_URL") || "https://equsto.com";
}

function smsE164(): string {
  const raw = env("EQUSTO_NOTIFY_SMS_E164") || env("EQUSTO_WHATSAPP_E164");
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("90") ? `+${d}` : `+90${d.replace(/^0/, "")}`;
}

export type NotifyResult = {
  sent: string[];
  skipped: string[];
  errors: string[];
};

/** Yapılandırılmış kanallara anlık uyarı (Telegram / e-posta / SMS). */
export async function sendInstantAlert(
  title: string,
  body: string
): Promise<NotifyResult> {
  const sent: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const text = `${title}\n\n${body}`.trim();

  const tgToken = telegramBotToken();
  const tgChat = telegramChatId();
  if (tgToken && tgChat) {
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${tgToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgChat,
            text,
            disable_web_page_preview: true,
          }),
        }
      );
      if (!r.ok) {
        throw new Error((await r.text()).slice(0, 240));
      }
      sent.push("telegram");
    } catch (e) {
      errors.push(
        `telegram: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  } else {
    skipped.push("telegram");
  }

  const resendKey = env("RESEND_API_KEY");
  const emailTo = env("EQUSTO_NOTIFY_EMAIL");
  if (resendKey && emailTo) {
    try {
      const from = env("RESEND_FROM") || "Equsto <onboarding@resend.dev>";
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [emailTo],
          subject: title,
          text: body,
        }),
      });
      if (!r.ok) {
        throw new Error((await r.text()).slice(0, 240));
      }
      sent.push("email");
    } catch (e) {
      errors.push(`email: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    skipped.push("email");
  }

  const twSid = env("TWILIO_ACCOUNT_SID");
  const twToken = env("TWILIO_AUTH_TOKEN");
  const twFrom = env("TWILIO_FROM");
  const to = smsE164();
  if (twSid && twToken && twFrom && to) {
    try {
      const auth = Buffer.from(`${twSid}:${twToken}`).toString("base64");
      const r = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to,
            From: twFrom,
            Body: text.slice(0, 1500),
          }),
        }
      );
      if (!r.ok) {
        throw new Error((await r.text()).slice(0, 240));
      }
      sent.push("sms");
    } catch (e) {
      errors.push(`sms: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    skipped.push("sms");
  }

  if (whatsAppSendConfigured() && whatsAppNotifyTo()) {
    try {
      const wa = await sendWhatsAppText(whatsAppNotifyTo(), text.slice(0, 4096));
      if (wa.ok) sent.push("whatsapp");
      else errors.push(`whatsapp: ${wa.error || "send failed"}`);
    } catch (e) {
      errors.push(`whatsapp: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    skipped.push("whatsapp");
  }

  return { sent, skipped, errors };
}

/** Telegram bildirimine tıklanabilir wa.me (müşteriye cevap). */
function customerWhatsAppLines(
  tel: string | null | undefined,
  previewMessage?: string | null
): string[] {
  const phone = normalizeWaRecipient(String(tel || ""));
  if (!phone) {
    return [
      "WhatsApp: Müşteri telefonu yok — site handoff (wa.me) bekleyin veya panelden dönün.",
    ];
  }

  const intro = "Merhaba, equsto.com üzerinden yazmıştınız.";
  const msg = String(previewMessage || "").trim();
  const text = [intro, msg].filter(Boolean).join("\n\n").slice(0, 800);
  const url = buildWaMeUrl(phone, text);
  if (!url) return [];

  return [`WhatsApp (müşteriye yaz): ${url}`];
}

function leadBody(m: Musteri): string {
  return [
    `Kim: ${m.yetkili || "Ziyaretçi"}`,
    m.tel ? `Tel: ${m.tel}` : "",
    m.mail ? `E-posta: ${m.mail}` : "",
    m.mesaj ? `Mesaj: ${m.mesaj}` : "",
    m.not && !m.mesaj ? `Not: ${m.not}` : "",
    m.kaynak ? `Kaynak: ${m.kaynak}` : "",
    m.sayfa ? `Sayfa: ${m.sayfa}` : "",
    ...customerWhatsAppLines(m.tel, m.mesaj),
    `Zaman: ${m.createdAt.toISOString()}`,
    `Panel: ${siteUrl()}/yonetim/isletme`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyNewLead(m: Musteri): Promise<NotifyResult> {
  return sendInstantAlert("Equsto — yeni mesaj (kedi sohbet)", leadBody(m));
}

function siparisBody(s: Siparis): string {
  return [
    `Sipariş: ${s.siparisNo}`,
    `Müşteri: ${s.musteriAd || "—"}`,
    s.musteriTel ? `Tel: ${s.musteriTel}` : "",
    s.musteriMail ? `E-posta: ${s.musteriMail}` : "",
    `Kalem: ${s.toplamKalem} · Adet: ${s.toplamAdet}`,
    `Tutar: ₺${Number(s.toplamTl)}`,
    s.kaynak ? `Kaynak: ${s.kaynak}` : "",
    ...customerWhatsAppLines(
      s.musteriTel,
      `Sipariş ${s.siparisNo} (${Number(s.toplamTl)} TL) hakkında yazıyorum.`
    ),
    `Panel: ${siteUrl()}/yonetim/isletme`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyNewSiparis(s: Siparis): Promise<NotifyResult> {
  return sendInstantAlert("Equsto — yeni sipariş", siparisBody(s));
}

export async function notifyNewTeklif(t: {
  ref_no: string;
  musteri_ad: string;
  musteri_tel: string;
  musteri_mail: string;
  konsept: string;
  toplam_tl: number;
  kaynak: string | null;
}): Promise<NotifyResult> {
  return sendInstantAlert(
    "Equsto — yeni PFOS teklifi",
    [
      `Referans: ${t.ref_no}`,
      `Müşteri: ${t.musteri_ad || "—"}`,
      t.musteri_tel ? `Tel: ${t.musteri_tel}` : "",
      t.musteri_mail ? `E-posta: ${t.musteri_mail}` : "",
      t.konsept ? `Konsept: ${t.konsept}` : "",
      `Tutar (TL tahmini): ₺${Number(t.toplam_tl).toLocaleString("tr-TR")}`,
      t.kaynak ? `Kaynak: ${t.kaynak}` : "",
      ...customerWhatsAppLines(
        t.musteri_tel,
        `PFOS teklif ${t.ref_no} hakkında yazıyorum.`,
      ),
      `Panel: ${siteUrl()}/yonetim/isletme`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export function notifyChannelsConfigured(): string[] {
  const out: string[] = [];
  if (telegramBotToken() && telegramChatId()) out.push("telegram");
  if (env("RESEND_API_KEY") && env("EQUSTO_NOTIFY_EMAIL")) out.push("email");
  if (
    env("TWILIO_ACCOUNT_SID") &&
    env("TWILIO_AUTH_TOKEN") &&
    env("TWILIO_FROM") &&
    smsE164()
  ) {
    out.push("sms");
  }
  if (whatsAppSendConfigured() && whatsAppNotifyTo()) out.push("whatsapp");
  return out;
}

/** Vercel tanılama — değerler loglanmaz, yalnızca dolu/boş */
export function notifyEnvHints() {
  return {
    TELEGRAM_BOT_TOKEN: telegramBotToken() ? "set" : "missing",
    TELEGRAM_CHAT_ID: telegramChatId() ? "set" : "missing",
    RESEND_API_KEY: env("RESEND_API_KEY") ? "set" : "missing",
    EQUSTO_NOTIFY_EMAIL: env("EQUSTO_NOTIFY_EMAIL") ? "set" : "missing",
  };
}
