import fs from "node:fs";
import path from "node:path";

export type LegacyPdpRedirectIndex = {
  builtAt: string;
  products: number;
  aliases: number;
  redirects: Record<string, string>;
};

let cached: LegacyPdpRedirectIndex | null = null;

/** Build çıktısı: public/data/legacy-pdp-redirects.json */
export function loadLegacyPdpRedirectIndex(): LegacyPdpRedirectIndex | null {
  if (cached) return cached;
  const file = path.join(process.cwd(), "public", "data", "legacy-pdp-redirects.json");
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as LegacyPdpRedirectIndex;
    if (!raw?.redirects || typeof raw.redirects !== "object") return null;
    cached = raw;
    return raw;
  } catch {
    return null;
  }
}

export function resolveLegacyPdpRedirect(pathname: string): string | null {
  const m = pathname.match(/^(\/en)?\/shop\/([^/]+)\/([^/?#]+)\/?$/i);
  if (!m) return null;

  const langPrefix = m[1] || "";
  const urlDept = m[2].toLowerCase();
  const slug = decodeURIComponent(m[3]).trim().toLowerCase().replace(/_/g, "-");
  const slugRaw = decodeURIComponent(m[3]).trim().toLowerCase();

  const index = loadLegacyPdpRedirectIndex();
  const dest = index?.redirects[slugRaw] ?? index?.redirects[slug];
  if (!dest) return null;

  const destPath = `${langPrefix}${dest}`;
  const normalizedCurrent = pathname.replace(/\/$/, "") || pathname;
  const normalizedDest = destPath.replace(/\/$/, "") || destPath;

  if (normalizedCurrent === normalizedDest) return null;

  const destDept = dest.match(/^\/shop\/([^/]+)\//)?.[1];
  if (destDept === urlDept && slug === dest.split("/").pop()) return null;

  return destPath;
}

/** Eski WordPress / vitrin kalıntıları */
export function resolveLegacySiteRedirect(pathname: string): string | null {
  const p = pathname.replace(/\/$/, "") || "/";

  if (/^\/category(\/|$)/i.test(p)) return "/";
  if (/^\/wp-(content|admin|includes)(\/|$)/i.test(p)) return "/";
  if (/^\/tag(\/|$)/i.test(p)) return "/blog";
  if (/^\/author(\/|$)/i.test(p)) return "/";
  if (p === "/endustriyel-mutfak-gastronomi-platformu-2") return "/";
  if (/^\/urun(\/|$)/i.test(p)) return "/shop";
  if (p === "/teklif-geri-bildirim") return "/iletisim";

  return null;
}

/**
 * GSC: /login?next=/shop/... ve /en/login.html?next=... — ürün sayfaları giriş gerektirmez.
 * Yalnızca aynı-origin public shop path; /sepet, hesap, yonetim vb. next değerlerine dokunulmaz.
 */
export function resolveLoginNextShopRedirect(
  pathname: string,
  nextParam: string | null | undefined,
): string | null {
  const path = pathname.replace(/\/$/, "") || "/";
  if (!/^(\/en)?\/login(\.html)?$/i.test(path)) return null;

  let next = String(nextParam || "").trim();
  if (!next) return null;
  try {
    next = decodeURIComponent(next);
  } catch {
    /* ham değer */
  }
  next = next.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;

  const hashIdx = next.indexOf("#");
  if (hashIdx >= 0) next = next.slice(0, hashIdx);
  const qIdx = next.indexOf("?");
  const pathPart = qIdx >= 0 ? next.slice(0, qIdx) : next;
  const queryPart = qIdx >= 0 ? next.slice(qIdx) : "";

  const shopPath = pathPart.replace(/\/$/, "") || "/";
  // Public vitrin: /shop, /shop/{dept}, /shop/{dept}/{slug} (+ /en)
  if (!/^(\/en)?\/shop(\/|$)/i.test(shopPath + "/")) return null;
  if (!/^(\/en)?\/shop(\/[^/]+){0,2}$/i.test(shopPath)) return null;

  return shopPath + queryPart;
}
