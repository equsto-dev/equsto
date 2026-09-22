export type ResendAttachment = {
  filename: string;
  content: Buffer;
};

export type SendResendOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: ResendAttachment[];
};

export type SendResendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; skipped?: boolean };

/** Resend 403 — onboarding@resend.dev yalnızca hesap e-postasına gider */
function friendlyResendError(raw: string): string {
  const account = process.env.RESEND_ACCOUNT_EMAIL?.trim() || "";
  if (
    /only send testing emails to your own email/i.test(raw) ||
    /verify a domain at resend\.com\/domains/i.test(raw)
  ) {
    const who = account || "Resend hesabınızdaki e-posta (jurnaldang@gmail.com)";
    return `Test gönderen adresi (${process.env.RESEND_FROM?.trim() || "onboarding@resend.dev"}) yalnızca ${who} adresine mail atabilir. Müşteriye göndermek için equsto.com domain doğrulaması gerekir.`;
  }
  return raw.slice(0, 400);
}

/** Müşteri / dış e-posta — RESEND_API_KEY gerekir */
export async function sendResendEmail(
  opts: SendResendOptions,
): Promise<SendResendResult> {
  const key = process.env.RESEND_API_KEY?.trim() || "";
  const to = opts.to.trim();
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY yok", skipped: true };
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Geçersiz alıcı e-postası" };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.EQUSTO_TEKLIF_FROM?.trim() ||
    "Equsto <onboarding@resend.dev>";

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject: opts.subject,
    text: opts.text,
  };
  if (opts.html) body.html = opts.html;
  if (opts.attachments?.length) {
    body.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const raw = await r.text();
      return { ok: false, error: friendlyResendError(raw) };
    }
    const json = (await r.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
