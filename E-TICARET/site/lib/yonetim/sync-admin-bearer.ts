import { getProToken, PRO_TOKEN_KEY } from "@/lib/pro-admin-client";

const ADMIN_BEARER_KEY = "equsto_admin_bearer";
const ADMIN_SESSION_OK = "equsto_admin_ok";

/** Yönetim Bearer → admin.html (iframe, aynı origin localStorage) */
export function syncYonetimBearerToAdmin(): void {
  if (typeof window === "undefined") return;
  const tok = getProToken();
  if (!tok) return;
  const w = window as Window & { EQUSTO_ADMIN_BEARER?: string };
  w.EQUSTO_ADMIN_BEARER = tok;
  try {
    localStorage.setItem(PRO_TOKEN_KEY, tok);
    sessionStorage.setItem(ADMIN_BEARER_KEY, tok);
    sessionStorage.setItem(ADMIN_SESSION_OK, "1");
  } catch {
    /* */
  }
}
