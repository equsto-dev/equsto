import type { Musteri, Siparis } from "@/lib/prisma";
import { appendWaChatMessage } from "@/lib/wa-chat";
import { normalizeWaRecipient } from "@/lib/whatsapp/config";
import { buildWaMeUrl } from "@/lib/whatsapp/link";
import {
  isOwnerSelfWhatsAppNotifyBlocked,
  ownerWhatsAppNotifyPhone,
  ownerWhatsAppNotifyPhones,
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

export type NotifyChannel = "telegram" | "email" | "sms" | "whatsapp";

export type SendInstantAlertOptions = {
  only?: NotifyChannel[];
  skip?: NotifyChannel[];
};

function mergeNotifyResults(...parts: NotifyResult[]): NotifyResult {
  const sent = [...new Set(parts.flatMap((p) => p.sent))];
  const skipped = [...new Set(parts.flatMap((p) => p.skipped))];
  const errors = parts.flatMap((p) => p.errors);
  return { sent, skipped, errors };
}

function channelEnabled(ch: NotifyChannel, opts?: SendInstantAlertOptions): boolean {
  if (opts?.only?.length && !opts.only.includes(ch)) return false;
  if (opts?.skip?.includes(ch)) return false;
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Telegram'da wa.me URL'sindeki %C5%9F gibi kodları gizle —
 * tıklanabilir Türkçe etiket + doğru encode edilmiş href.
 */
function toTelegramHtml(title: string, body: string): string {
  const full = `${title}\n\n${body}`.trim();
  return full
    .split("\n")
    .map((line) => {
      const m = line.match(
        /^(WhatsApp \(müşteriye yaz\): )(https:\/\/wa\.me\/\S+)$/,
      );
      if (m) {
        return `${escapeHtml(m[1])}<a href="${escapeHtml(m[2])}">Müşteriye hazır mesajla yaz</a>`;
      }
      return escapeHtml(line);
    })
    .join("\n");
}

/** Yapılandırılmış kanallara anlık uyarı (Telegram / e-posta / SMS / WhatsApp). */
export async function sendInstantAlert(
  title: string,
  body: string,
  opts?: SendInstantAlertOptions,
): Promise<NotifyResult> {
  const sent: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const text = `${title}\n\n${body}`.trim();

  const tgToken = telegramBotToken();
  const tgChat = telegramChatId();
  if (channelEnabled("telegram", opts) && tgToken && tgChat) {
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${tgToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgChat,
            text: toTelegramHtml(title, body),
            parse_mode: "HTML",
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
  } else if (channelEnabled("telegram", opts)) {
    skipped.push("telegram");
  }

  const resendKey = env("RESEND_API_KEY");
  const emailTo = env("EQUSTO_NOTIFY_EMAIL");
  if (channelEnabled("email", opts) && resendKey && emailTo) {
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
  } else if (channelEnabled("email", opts)) {
    skipped.push("email");
  }

  const twSid = env("TWILIO_ACCOUNT_SID");
  const twToken = env("TWILIO_AUTH_TOKEN");
  const twFrom = env("TWILIO_FROM");
  const to = smsE164();
  if (channelEnabled("sms", opts) && twSid && twToken && twFrom && to) {
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
  } else if (channelEnabled("sms", opts)) {
    skipped.push("sms");
    if (to && twToken && (!twSid || !twFrom)) {
      errors.push(
        "sms: Twilio eksik — TWILIO_ACCOUNT_SID (AC…) ve TWILIO_FROM (Twilio numarası) gerekli; FROM olarak 0532… kullanılamaz",
      );
    }
  }

  const ownerWaTargets = ownerWhatsAppNotifyPhones();
  if (channelEnabled("whatsapp", opts) && whatsAppSendConfigured() && ownerWaTargets.length) {
    let anyOk = false;
    for (const to of ownerWaTargets) {
      try {
        const wa = await sendWhatsAppText(to, text.slice(0, 4096));
        if (wa.ok) anyOk = true;
        else errors.push(`whatsapp(…${to.slice(-4)}): ${wa.error || "send failed"}`);
      } catch (e) {
        errors.push(
          `whatsapp(…${to.slice(-4)}): ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    if (anyOk) sent.push("whatsapp");
  } else if (channelEnabled("whatsapp", opts)) {
    skipped.push("whatsapp");
    if (
      whatsAppSendConfigured() &&
      whatsAppNotifyTo() &&
      !ownerWaTargets.length &&
      isOwnerSelfWhatsAppNotifyBlocked()
    ) {
      errors.push(
        "whatsapp: Bildirim hedefi Green API hattıyla aynı — WHATSAPP_NOTIFY_ALT_TO (ikinci hat) tanımlayın",
      );
    }
  }

  return { sent, skipped, errors };
}

/** Telegram/e-posta bildirimine tıklanabilir wa.me (müşteriye cevap). */
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

  // URL teknik olarak encode kalır (wa.me için gerekli); düz metinde Türkçe önizleme ayrı satırda.
  return [
    `WhatsApp (müşteriye yaz): ${url}`,
    text ? `Hazır mesaj: ${text}` : "",
  ].filter(Boolean);
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

/** WhatsApp modal — sahip bildirimi (WA / Telegram / e-posta). */
export async function notifyWhatsAppModalLead(m: Musteri): Promise<NotifyResult> {
  const title = "Equsto — WhatsApp modal mesajı";
  const body = leadBody(m);
  const ownerTargets = ownerWhatsAppNotifyPhones();

  if (isOwnerSelfWhatsAppNotifyBlocked() && !ownerTargets.length) {
    const push = await sendInstantAlert(title, body, {
      only: ["telegram", "email"],
    });
    if (!push.sent.length) {
      console.warn(
        "[notify] whatsapp-modal: Green API hattı kendine WA alamaz; Telegram veya WHATSAPP_NOTIFY_ALT_TO gerekli",
        push,
      );
    }
    return push;
  }

  const ownerWa = ownerTargets.length
    ? await sendInstantAlert(title, body, { only: ["whatsapp"] })
    : { sent: [] as string[], skipped: ["whatsapp"], errors: [] as string[] };
  const rest = await sendInstantAlert(title, body, { skip: ["whatsapp", "sms"] });
  const merged = mergeNotifyResults(ownerWa, rest);
  if (ownerTargets.length && !merged.sent.includes("whatsapp")) {
    console.warn("[notify] whatsapp-modal: sahip WA bildirimi gönderilemedi", merged);
  }
  return merged;
}

/** Müşteriye WhatsApp onayı (Green API / Meta — telefon profilde kayıtlı olmalı) */
export async function notifyCustomerLeadAck(m: Musteri): Promise<void> {
  if (!whatsAppSendConfigured()) return;
  const to = normalizeWaRecipient(m.tel);
  if (!to) return;
  const preview = String(m.mesaj || "").trim().slice(0, 240);
  const text = [
    "Equsto — mesajınız alındı.",
    preview ? `"${preview}"` : "",
    "En kısa sürede size dönüş yapacağız.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const wa = await sendWhatsAppText(to, text);
  if (!wa.ok) {
    console.error("[notify] customer wa ack", wa.error);
    return;
  }
  void appendWaChatMessage({
    phone: to,
    role: "team",
    body: text,
    waMessageId: wa.messageId,
  }).catch((e) => console.error("[wa-chat] customer ack", e));
}

function siparisBody(s: Siparis): string {
  return [
    `Sipariş: ${s.siparisNo}`,
    `Müşteri: ${s.musteriAd || "—"}`,
    s.musteriTel ? `Tel: ${s.musteriTel}` : "",
    s.musteriMail ? `E-posta: ${s.musteriMail}` : "",
    `Ödeme: ${s.odemeDurum || "yok"}`,
    `Kalem: ${s.toplamKalem} · Adet: ${s.toplamAdet}`,
    `Tutar: ₺${Number(s.toplamTl)}`,
    s.kaynak ? `Kaynak: ${s.kaynak}` : "",
    ...customerWhatsAppLines(
      s.musteriTel,
      `Sipariş ${s.siparisNo} (${Number(s.toplamTl)} TL) hakkında yazıyorum.`,
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
  if (whatsAppSendConfigured() && ownerWhatsAppNotifyPhones().length) out.push("whatsapp");
  return out;
}

/** Vercel tanılama — değerler loglanmaz, yalnızca dolu/boş */
export function notifyEnvHints() {
  return {
    TELEGRAM_BOT_TOKEN: telegramBotToken() ? "set" : "missing",
    TELEGRAM_CHAT_ID: telegramChatId() ? "set" : "missing",
    RESEND_API_KEY: env("RESEND_API_KEY") ? "set" : "missing",
    EQUSTO_NOTIFY_EMAIL: env("EQUSTO_NOTIFY_EMAIL") ? "set" : "missing",
    owner_self_wa_blocked: isOwnerSelfWhatsAppNotifyBlocked() ? "yes" : "no",
    owner_wa_notify_target: ownerWhatsAppNotifyPhone() ? "set" : "missing",
    owner_wa_notify_count: String(ownerWhatsAppNotifyPhones().length),
    WHATSAPP_NOTIFY_ALT_TO: env("WHATSAPP_NOTIFY_ALT_TO") ? "set" : "missing",
  };
}
