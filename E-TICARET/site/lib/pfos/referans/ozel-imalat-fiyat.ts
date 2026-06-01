import { dataPath, readJsonFile } from "@/lib/legacy-data";

type OzelFiyatConfig = {
  kur_eur_try_kdv_dahil?: number;
  tezgah?: {
    taban_eur_m2?: number;
    tek_evye_ek_eur?: number;
    cift_evye_ek_eur?: number;
    dolap_ek_eur?: number;
    kasa_banko_ek_eur?: number;
    min_eur?: number;
  };
};

let cache: OzelFiyatConfig | null = null;

async function loadConfig(): Promise<OzelFiyatConfig> {
  if (cache) return cache;
  try {
    cache = await readJsonFile<OzelFiyatConfig>(
      dataPath("pfos-ozel-imalat-fiyatlari.json"),
    );
  } catch {
    cache = { kur_eur_try_kdv_dahil: 64, tezgah: { min_eur: 420, taban_eur_m2: 220 } };
  }
  return cache!;
}

function parseOlcuCm(notlar: string | null | undefined): {
  w: number;
  d: number;
} | null {
  const m = String(notlar ?? "").match(
    /(\d+(?:[.,]\d+)?)\s*[*xX×]\s*(\d+(?:[.,]\d+)?)/,
  );
  if (!m) return null;
  return {
    w: Number(m[1].replace(",", ".")),
    d: Number(m[2].replace(",", ".")),
  };
}

/** Equsto atölye tezgah / duvar rafı tahmini fiyat (TRY, KDV dahil) */
export async function estimateOzelImalatFiyatTry(
  isim: string,
  notlar?: string | null,
): Promise<number> {
  const cfg = await loadConfig();
  const kur = cfg.kur_eur_try_kdv_dahil ?? 64;
  const t = cfg.tezgah ?? {};
  const n = isim.toLocaleLowerCase("tr");

  if (/duvar\s*raf/.test(n)) {
    const olcu = parseOlcuCm(notlar);
    const w = olcu?.w ?? 100;
    const eur = Math.max(85, (w / 100) * 95);
    return Math.round(eur * kur);
  }

  if (!/tezgah|banko|kasa/.test(n)) return 0;

  const olcu = parseOlcuCm(notlar);
  if (!olcu) return 0;

  const m2 = (olcu.w / 100) * (olcu.d / 100);
  let eur = m2 * (t.taban_eur_m2 ?? 220);

  if (/tek\s*evyeli/.test(n)) eur += t.tek_evye_ek_eur ?? 185;
  if (/çift\s*evyeli|cift\s*evyeli/.test(n)) eur += t.cift_evye_ek_eur ?? 320;
  if (/dolap|taban ve ara|ara raf/.test(n)) eur += t.dolap_ek_eur ?? 145;
  if (/kasa\s*banko|banko/.test(n)) eur += t.kasa_banko_ek_eur ?? 95;

  eur = Math.max(t.min_eur ?? 420, eur);
  return Math.round(eur * kur);
}
