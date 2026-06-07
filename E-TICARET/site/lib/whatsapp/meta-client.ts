import {
  normalizeWaRecipient,
  whatsAppAccessToken,
  whatsAppMetaConfigured,
  whatsAppPhoneNumberId,
} from "./config";

export { whatsAppMetaConfigured };

const GRAPH = "https://graph.facebook.com/v21.0";

export type WaSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  status?: number;
};

async function graphPost(path: string, body: unknown): Promise<WaSendResult> {
  if (!whatsAppMetaConfigured()) {
    return { ok: false, error: "WhatsApp Cloud API yapılandırılmamış" };
  }

  const token = whatsAppAccessToken();
  const r = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await r.json().catch(() => ({}))) as {
    messages?: { id?: string }[];
    error?: { message?: string; error_user_msg?: string };
  };

  if (!r.ok) {
    const msg =
      json.error?.error_user_msg ||
      json.error?.message ||
      (await r.text().catch(() => "")).slice(0, 240) ||
      `HTTP ${r.status}`;
    return { ok: false, error: msg, status: r.status };
  }

  return {
    ok: true,
    messageId: json.messages?.[0]?.id,
    status: r.status,
  };
}

/** Serbest metin — 24 saat penceresi içinde veya onaylı şablon gerekir */
export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<WaSendResult> {
  const recipient = normalizeWaRecipient(to);
  if (!recipient) return { ok: false, error: "Geçersiz alıcı numarası" };
  const text = String(body || "").trim().slice(0, 4096);
  if (!text) return { ok: false, error: "Mesaj boş" };

  return graphPost(`${whatsAppPhoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

/** Onaylı şablon (ilk temas / pencere dışı) */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "tr",
  components?: unknown[]
): Promise<WaSendResult> {
  const recipient = normalizeWaRecipient(to);
  if (!recipient) return { ok: false, error: "Geçersiz alıcı numarası" };
  if (!templateName.trim()) return { ok: false, error: "Şablon adı gerekli" };

  return graphPost(`${whatsAppPhoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName.trim(),
      language: { code: languageCode },
      ...(components?.length ? { components } : {}),
    },
  });
}

export async function markWhatsAppRead(messageId: string): Promise<void> {
  if (!whatsAppMetaConfigured() || !messageId) return;
  await graphPost(`${whatsAppPhoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  }).catch(() => {});
}

async function uploadWhatsAppMedia(
  file: Buffer,
  mimeType: string,
  filename: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!whatsAppMetaConfigured()) {
    return { ok: false, error: "WhatsApp Cloud API yapılandırılmamış" };
  }

  const token = whatsAppAccessToken();
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", new Blob([new Uint8Array(file)], { type: mimeType }), filename.slice(0, 120));

  const r = await fetch(`${GRAPH}/${whatsAppPhoneNumberId()}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = (await r.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string; error_user_msg?: string };
  };

  if (!r.ok || !json.id) {
    const msg =
      json.error?.error_user_msg ||
      json.error?.message ||
      (await r.text().catch(() => "")).slice(0, 240) ||
      `HTTP ${r.status}`;
    return { ok: false, error: msg };
  }

  return { ok: true, id: json.id };
}

/** PDF / belge gönder (Meta Cloud API) */
export async function sendWhatsAppDocument(
  to: string,
  file: Buffer,
  filename: string,
  caption?: string,
): Promise<WaSendResult> {
  const recipient = normalizeWaRecipient(to);
  if (!recipient) return { ok: false, error: "Geçersiz alıcı numarası" };

  const uploaded = await uploadWhatsAppMedia(
    file,
    "application/pdf",
    filename || "equsto-teklif.pdf",
  );
  if (!uploaded.ok) return { ok: false, error: uploaded.error };

  return graphPost(`${whatsAppPhoneNumberId()}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "document",
    document: {
      id: uploaded.id,
      filename: filename.slice(0, 120) || "equsto-teklif.pdf",
      ...(caption?.trim() ? { caption: caption.trim().slice(0, 1024) } : {}),
    },
  });
}
