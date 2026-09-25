import fs from "node:fs";
import path from "node:path";

export type LegacyPdpRedirectIndex = {
  builtAt: string;
  products: number;
  aliases: number;
  redirects: Record<string, string>;
};

let cached: LegacyPdpRedirectIndex | null = null;
let cachedExtra: Record<string, string> | null = null;
let cachedGone: Set<string> | null = null;

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

/** GSC P0 ek alias’lar (yanlış marka slug, kırık zincir hedefi) */
function loadExtraPdpRedirects(): Record<string, string> {
  if (cachedExtra) return cachedExtra;
  const file = path.join(process.cwd(), "public", "data", "gsc-extra-pdp-redirects.json");
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { redirects?: Record<string, string> };
    cachedExtra = raw?.redirects && typeof raw.redirects === "object" ? raw.redirects : {};
  } catch {
    cachedExtra = {};
  }
  return cachedExtra;
}

/** GSC P1 — canlıda 404 doğrulanmış ölü PDP path’leri → 410 */
export function loadGscGonePaths(): Set<string> {
  if (cachedGone) return cachedGone;
  const file = path.join(process.cwd(), "public", "data", "gsc-gone-paths.json");
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { paths?: string[] };
    cachedGone = new Set((raw?.paths || []).map((p) => p.replace(/\/$/, "") || "/"));
  } catch {
    cachedGone = new Set();
  }
  return cachedGone;
}

function lookupRedirectDest(slugRaw: string, slugNorm: string): string | null {
  const index = loadLegacyPdpRedirectIndex();
  const extra = loadExtraPdpRedirects();
  return (
    extra[slugRaw] ||
    extra[slugNorm] ||
    index?.redirects[slugRaw] ||
    index?.redirects[slugNorm] ||
    null
  );
}

/**
 * Tek hop çözüm. Çağıran, zinciri tek 308’e indirmek için iterate eder.
 */
function resolveLegacyPdpRedirectOneHop(pathname: string): string | null {
  const m = pathname.match(/^(\/en)?\/shop\/([^/]+)\/([^/?#]+)\/?$/i);
  if (!m) return null;

  const langPrefix = m[1] || "";
  const urlDept = m[2].toLowerCase();
  const slugRaw = decodeURIComponent(m[3]).trim().toLowerCase();
  const slug = slugRaw.replace(/_/g, "-");

  const dest = lookupRedirectDest(slugRaw, slug);
  if (!dest) return null;

  const destPath = `${langPrefix}${dest}`;
  const normalizedCurrent = pathname.replace(/\/$/, "") || pathname;
  const normalizedDest = destPath.replace(/\/$/, "") || destPath;

  if (normalizedCurrent === normalizedDest) return null;

  const destDept = dest.match(/^\/shop\/([^/]+)\//)?.[1];
  const destSlug = dest.split("/").pop() || "";
  if (destDept === urlDept && (slug === destSlug || slugRaw === destSlug)) return null;

  return destPath;
}

/**
 * GSC 404 / redirect hatası — eski ürün slug → kanonik /shop/{dept}/{sku-slug}.
 * Çok hop’u tek 308’de birleştirir (dolap→tezgah→sku).
 */
export function resolveLegacyPdpRedirect(pathname: string): string | null {
  let current = pathname.replace(/\/$/, "") || pathname;
  let finalDest: string | null = null;

  for (let i = 0; i < 5; i++) {
    const next = resolveLegacyPdpRedirectOneHop(current);
    if (!next) break;
    finalDest = next;
    const normNext = next.replace(/\/$/, "") || next;
    if (normNext === current) break;
    current = normNext;
  }

  if (!finalDest) return null;
  const normalizedCurrent = pathname.replace(/\/$/, "") || pathname;
  const normalizedDest = finalDest.replace(/\/$/, "") || finalDest;
  if (normalizedCurrent === normalizedDest) return null;
  return finalDest;
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
  if (!/^(\/en)?\/shop(\/|$)/i.test(shopPath + "/")) return null;
  if (!/^(\/en)?\/shop(\/[^/]+){0,2}$/i.test(shopPath)) return null;

  return shopPath + queryPart;
}

/** Doğrulanmış ölü PDP — 410 Gone (çalışan 200 sayfalara uygulanmaz; liste canlı 404’ten). */
export function resolveGscGonePath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return loadGscGonePaths().has(p);
}
