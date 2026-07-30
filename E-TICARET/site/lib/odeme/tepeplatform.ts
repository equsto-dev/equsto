import { createHmac, timingSafeEqual } from "node:crypto";
import { getSiteOrigin } from "@/lib/site-origin";

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function tepeplatformConfigured(): boolean {
  if (env("TEPEPLATFORM_ENABLED").toLowerCase() === "false") return false;
  return Boolean(
    env("TEPEPLATFORM_API_KEY") &&
      env("TEPEPLATFORM_API_SECRET") &&
      env("TEPEPLATFORM_BASE_URL"),
  );
}

export function tepeplatformBaseUrl(): string {
  return (env("TEPEPLATFORM_BASE_URL") || "https://tepeplatform.com").replace(/\/$/, "");
}

export function tepeplatformPartnerSlug(): string {
  return env("TEPEPLATFORM_PARTNER_SLUG") || "equsto";
}

export function tepeplatformApiKey(): string {
  return env("TEPEPLATFORM_API_KEY");
}

export function tepeplatformApiSecret(): string {
  return env("TEPEPLATFORM_API_SECRET");
}

/** Init imzası: POST\n/path\n{ts}\n{body} */
export function signPartnerRequest(
  method: string,
  path: string,
  timestampSec: string,
  rawBody: string,
  secret = tepeplatformApiSecret(),
): string {
  const canonical = `${method}\n${path}\n${timestampSec}\n${rawBody}`;
  return createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
}

/** Webhook imzası: sha256=HMAC(secret, rawBody) */
export function verifyWebhookSignature(
  rawBody: string,
  headerValue: string | null,
  secret = tepeplatformApiSecret(),
): boolean {
  if (!headerValue || !secret) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(headerValue).trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type TepeInitCustomer = {
  name: string;
  email: string;
  phone: string;
  address?: string;
};

export type TepeInitPayload = {
  orderRef: string;
  amountMinor: number;
  currency: "TRY";
  description: string;
  customer: TepeInitCustomer;
  redirectSuccess: string;
  redirectFailure: string;
  expiresInSec?: number;
  metadata?: Record<string, unknown>;
};

export type TepeInitResponse = {
  ok?: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  iframeUrl?: string;
  expiresAt?: string;
  orderRef?: string;
  status?: string;
  error?: string;
  message?: string;
};

export async function tepeplatformInitPayment(
  payload: TepeInitPayload,
): Promise<TepeInitResponse> {
  if (!tepeplatformConfigured()) {
    throw new Error("TepePlatform yapılandırılmamış (TEPEPLATFORM_* env)");
  }

  const path = "/api/partner/payments/init";
  const url = `${tepeplatformBaseUrl()}${path}`;
  const rawBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signPartnerRequest("POST", path, timestamp, rawBody);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TP-Api-Key": tepeplatformApiKey(),
      "X-TP-Timestamp": timestamp,
      "X-TP-Signature": signature,
    },
    body: rawBody,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as TepeInitResponse;
  if (!res.ok) {
    const msg =
      data.error || data.message || `TepePlatform init HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  if (!data.checkoutUrl || !data.sessionId) {
    throw new Error("TepePlatform checkoutUrl/sessionId dönmedi");
  }
  return data;
}

export function tlToMinor(tl: number): number {
  return Math.round(Number(tl) * 100);
}

export function minorToTl(minor: number): number {
  return Math.round(Number(minor)) / 100;
}

export function gsmToE164(tel: string): string {
  const d = String(tel || "").replace(/\D/g, "");
  if (!d) return "+905350000000";
  if (d.startsWith("90") && d.length >= 12) return `+${d}`;
  if (d.startsWith("0") && d.length >= 11) return `+9${d}`;
  if (d.length === 10) return `+90${d}`;
  return `+${d}`;
}

export function odemeBasariliUrl(orderRef: string): string {
  return `${getSiteOrigin()}/odeme/basarili?orderRef=${encodeURIComponent(orderRef)}`;
}

export function odemeHataUrl(orderRef: string): string {
  return `${getSiteOrigin()}/odeme/hata?orderRef=${encodeURIComponent(orderRef)}`;
}
