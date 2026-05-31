import type { EticaretIcerik } from "@/lib/pro-admin-client";

/** Admin panel + vitrin (eq-vitrin-config) alan adlarını birleştirir. */
export function normalizeEticaretIcerik(raw: EticaretIcerik): EticaretIcerik {
  return {
    k: (raw.k || []).map((item) => {
      const active = item.active !== false && item.aktif !== false;
      return {
        ...item,
        ad: String(item.ad || "").trim(),
        desc: item.desc || item.acik,
        acik: item.acik || item.desc || "",
        active,
        aktif: active,
      };
    }),
    kp: (raw.kp || []).map((item) => ({
      ...item,
      kod: String(item.kod || "").trim().toUpperCase(),
      aktif: item.aktif !== false,
    })),
    b: (raw.b || []).map((item) => ({
      ...item,
      url: String(item.url || "").trim(),
      baslik: item.baslik || item.aciklama || "",
      aciklama: item.aciklama || item.baslik || "",
      konum: item.konum || "anasayfa_hero",
      aktif: item.aktif !== false,
    })),
    dy: Array.isArray(raw.dy) ? raw.dy : [],
    r: Array.isArray(raw.r) ? raw.r : [],
    a: typeof raw.a === "object" && raw.a ? raw.a : {},
  };
}
