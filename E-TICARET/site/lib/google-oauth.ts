import { randomBytes } from "node:crypto";
import { googleClientId } from "@/lib/member-auth";

export function googleClientSecret(): string {
  return (
    process.env.EQUSTO_GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    ""
  );
}

/** Google’a her zaman public HTTPS origin — proxy/docker http://app:3000 geçersiz istek üretir. */
export function googleOAuthPublicOrigin(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    "https://equsto.com"
  )
    .trim()
    .replace(/\/$/, "");
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    u.protocol = "https:";
    u.hostname = u.hostname.replace(/^www\./i, "");
    return u.origin;
  } catch {
    return "https://equsto.com";
  }
}

export function googleOAuthRedirectUri(_origin?: string): string {
  return `${googleOAuthPublicOrigin()}/api/auth/google/callback`;
}

export function newOauthNonce(): string {
  return randomBytes(24).toString("base64url");
}

export function safeAuthNext(raw: string | null | undefined): string {
  const next = String(raw || "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/hesabim";
  if (next.startsWith("/api/") || next.startsWith("/yonetim")) return "/hesabim";
  return next.slice(0, 240);
}

export type OauthState = {
  n: string;
  next: string;
  sync: string;
};

export function encodeOauthState(state: OauthState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodeOauthState(raw: string): OauthState | null {
  try {
    const o = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OauthState;
    if (!o || typeof o.n !== "string") return null;
    return {
      n: o.n,
      next: safeAuthNext(o.next),
      sync: typeof o.sync === "string" ? o.sync : "",
    };
  } catch {
    return null;
  }
}

export function googleAuthorizeUrl(opts: {
  origin: string;
  state: string;
}): string | null {
  const clientId = googleClientId();
  if (!clientId || !googleClientSecret()) return null;
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", googleOAuthRedirectUri(opts.origin));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", opts.state);
  u.searchParams.set("access_type", "online");
  u.searchParams.set("prompt", "select_account");
  u.searchParams.set("include_granted_scopes", "true");
  return u.toString();
}

export async function exchangeGoogleCode(
  code: string,
  origin: string,
): Promise<{ idToken: string }> {
  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth yapılandırılmamış");
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleOAuthRedirectUri(origin),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.id_token) {
    throw new Error(data.error_description || data.error || "Google kodu doğrulanamadı");
  }
  return { idToken: data.id_token };
}
