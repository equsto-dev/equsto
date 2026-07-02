"use client";

const PFOS_CONTEXT_KEY = "eq_pfos_context_v1";

export type PfosBrowseContext = {
  konseptLabel?: string;
  dukkanTuru?: string;
  ustSegment?: string;
};

export function setPfosBrowseContext(ctx: PfosBrowseContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PFOS_CONTEXT_KEY,
      JSON.stringify({
        konseptLabel: String(ctx.konseptLabel ?? "").trim(),
        dukkanTuru: String(ctx.dukkanTuru ?? "").trim(),
        ustSegment: String(ctx.ustSegment ?? "").trim(),
        updatedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function readPfosBrowseContext(): PfosBrowseContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(PFOS_CONTEXT_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      konseptLabel: String(o.konseptLabel ?? "").trim(),
      dukkanTuru: String(o.dukkanTuru ?? "").trim(),
      ustSegment: String(o.ustSegment ?? "").trim(),
    };
  } catch {
    return {};
  }
}

export function clearPfosBrowseContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PFOS_CONTEXT_KEY);
  } catch {
    /* ignore */
  }
}

/** sessionStorage anahtarı — eq-product-page-inline.js ile paylaşılır */
export const PFOS_CONTEXT_STORAGE_KEY = PFOS_CONTEXT_KEY;
