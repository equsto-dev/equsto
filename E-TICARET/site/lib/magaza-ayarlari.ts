import { readJsonFile } from "@/lib/legacy-data";

export type MagazaAyarlari = {
  whatsapp_e164: string;
  whatsapp_prefill: string;
  ucretsiz_kargo: boolean;
  ucretsiz_kargo_limit_tl: number;
  kargo_bolgeleri: string[];
  kdv_gosterim: "dahil" | "haric";
  kdv_oran: number;
  i18n_overrides: Record<string, Record<string, string>>;
};

export const DEFAULT_MAGAZA_AYARLARI: MagazaAyarlari = {
  whatsapp_e164:
    process.env.EQUSTO_WHATSAPP_E164?.trim() || "905326840152",
  whatsapp_prefill: "Merhaba, equsto.com üzerinden yazıyorum.",
  ucretsiz_kargo: true,
  ucretsiz_kargo_limit_tl: 0,
  kargo_bolgeleri: ["Türkiye geneli"],
  kdv_gosterim: "dahil",
  kdv_oran: 20,
  i18n_overrides: {},
};

export function parseMagazaAyarlari(raw: Record<string, unknown> | undefined): MagazaAyarlari {
  const a = raw ?? {};
  const i18nRaw = a.i18n_overrides;
  let i18n: Record<string, Record<string, string>> = {};
  if (i18nRaw && typeof i18nRaw === "object" && !Array.isArray(i18nRaw)) {
    for (const [locale, vals] of Object.entries(i18nRaw)) {
      if (vals && typeof vals === "object" && !Array.isArray(vals)) {
        const row: Record<string, string> = {};
        for (const [k, v] of Object.entries(vals as Record<string, unknown>)) {
          if (typeof v === "string") row[k] = v;
        }
        i18n[locale] = row;
      }
    }
  }

  const kdv = String(a.kdv_gosterim ?? "dahil").toLowerCase();

  return {
    whatsapp_e164: String(a.whatsapp_e164 ?? DEFAULT_MAGAZA_AYARLARI.whatsapp_e164).trim(),
    whatsapp_prefill: String(
      a.whatsapp_prefill ?? DEFAULT_MAGAZA_AYARLARI.whatsapp_prefill,
    ).trim(),
    ucretsiz_kargo: a.ucretsiz_kargo !== false,
    ucretsiz_kargo_limit_tl: Number(a.ucretsiz_kargo_limit_tl ?? 0) || 0,
    kargo_bolgeleri: Array.isArray(a.kargo_bolgeleri)
      ? a.kargo_bolgeleri.map((x) => String(x).trim()).filter(Boolean)
      : DEFAULT_MAGAZA_AYARLARI.kargo_bolgeleri,
    kdv_gosterim: kdv === "haric" ? "haric" : "dahil",
    kdv_oran: Number(a.kdv_oran ?? 20) || 20,
    i18n_overrides: i18n,
  };
}

export async function loadMagazaAyarlari(): Promise<MagazaAyarlari> {
  const file = await readJsonFile<{ a?: Record<string, unknown> }>("eticaret-icerik.json");
  return parseMagazaAyarlari(file?.a);
}

/** Dot-path override birleştirme (shallow merge per locale) */
export function applyI18nOverrides(
  base: Record<string, unknown>,
  overrides: Record<string, string>,
): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  for (const [path, val] of Object.entries(overrides)) {
    const parts = path.split(".").filter(Boolean);
    if (!parts.length) continue;
    let node: Record<string, unknown> = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!node[p] || typeof node[p] !== "object") node[p] = {};
      node = node[p] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = val;
  }
  return out;
}
