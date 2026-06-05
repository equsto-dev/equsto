import { readJsonFile } from "@/lib/legacy-data";
import { writeJsonFile } from "@/lib/legacy-data-fs";
import { dataPath } from "@/lib/legacy-data-fs";
import { normalizeEticaretIcerik } from "@/lib/pro/eticaret-normalize";

type KuponRow = {
  kod: string;
  tutar?: number;
  yuzde?: number;
  ind?: number;
  tip?: string;
  lim?: number | null;
  ku?: number;
  aktif: boolean;
};

type EticaretFile = {
  k: unknown[];
  kp: KuponRow[];
  b: unknown[];
  dy: unknown[];
  r: unknown[];
  a: Record<string, unknown>;
};

async function loadEticaret(): Promise<EticaretFile> {
  const file = await readJsonFile<EticaretFile>("eticaret-icerik.json");
  if (file && Array.isArray(file.kp)) return file;
  return { k: [], kp: [], b: [], dy: [], r: [], a: {} };
}

export type KuponDogrulaResult = {
  ok: boolean;
  kod?: string;
  indirim_tl?: number;
  indirim_yuzde?: number;
  yeni_toplam_tl?: number;
  error?: string;
};

export async function dogrulaKupon(
  kod: string,
  sepetToplamTl: number,
): Promise<KuponDogrulaResult> {
  const normalized = String(kod ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return { ok: false, error: "Kupon kodu gerekli" };

  const file = await loadEticaret();
  const row = file.kp.find((k) => String(k.kod ?? "").trim().toUpperCase() === normalized);
  if (!row) return { ok: false, error: "Geçersiz kupon" };
  if (row.aktif === false) return { ok: false, error: "Kupon pasif" };

  const limit = row.lim ?? null;
  const used = row.ku ?? 0;
  if (limit != null && limit > 0 && used >= limit) {
    return { ok: false, error: "Kupon kullanım limiti doldu" };
  }

  const tip = String(row.tip ?? "").toLowerCase();
  let indirimTl = 0;
  let indirimYuzde = 0;

  if (tip === "tutar" || (row.tutar && row.tutar > 0)) {
    indirimTl = Number(row.tutar ?? row.ind ?? 0) || 0;
  } else {
    indirimYuzde = Number(row.yuzde ?? row.ind ?? 0) || 0;
    indirimTl = Math.round(sepetToplamTl * (indirimYuzde / 100));
  }

  if (indirimTl <= 0 && indirimYuzde <= 0) {
    return { ok: false, error: "Kupon indirimi tanımsız" };
  }

  const yeniToplam = Math.max(0, sepetToplamTl - indirimTl);
  return {
    ok: true,
    kod: normalized,
    indirim_tl: indirimTl,
    indirim_yuzde: indirimYuzde || undefined,
    yeni_toplam_tl: yeniToplam,
  };
}

/** Sipariş sonrası kullanım sayacını artır */
export async function incrementKuponUsage(kod: string): Promise<void> {
  const normalized = String(kod ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return;

  const file = await loadEticaret();
  const idx = file.kp.findIndex((k) => String(k.kod ?? "").trim().toUpperCase() === normalized);
  if (idx < 0) return;

  const row = file.kp[idx];
  file.kp[idx] = { ...row, ku: (row.ku ?? 0) + 1 };
  const normalizedFile = normalizeEticaretIcerik({
    k: file.k as import("@/lib/pro-admin-client").EticaretKampanya[],
    kp: file.kp,
    b: file.b as import("@/lib/pro-admin-client").EticaretBanner[],
    dy: file.dy,
    r: file.r,
    a: file.a,
  });
  await writeJsonFile(dataPath("eticaret-icerik.json"), normalizedFile);
}
