/**
 * Faz B — teklif bağlamına göre yardımcı ekipman önceliklendirme.
 * Konsept havuzu + tamamlayıcı kurallar + m² + eksik zorunlu kalemler.
 */

import { normalizeTipKodu, resolveTipKodu } from "@/lib/pfos/core/tip-kodu";
import { yardimciLabelToTip } from "@/lib/pfos/wizard/yardimci-label-tip";

/** tip_kodu → vitrin etiketi (katalog eşlemesi için) */
export const ONERI_ETIKET_BY_TIP: Record<string, string> = {
  kahve_degirmeni: "Kahve değirmeni (reserve)",
  bardak_yikama: "Bardak yıkayıcı",
  vakum_makinesi: "Vakum makinası",
  buz_makinesi: "Buz makinası",
  dilimleme_makinesi: "Dilimleme makinası",
  salamander: "Salamander",
  benmari_set: "Benmari seti",
  benmari_mobil: "Benmari seti",
  teshir_vitrin: "Teşhir vitrin",
  tartim_terazi: "Tartı seti",
  firin_arabasi: "Mutfak arabası",
  spiral_hamur: "Spiral hamur yoğurma",
  bar_blender: "Blender seti",
  banket_arabasi: "Isıtıcı arabalar (banket)",
  kiyma_makinesi: "Et kıyma (ilave)",
  bar_buzdolabi: "Şarap dolabı",
  meyve_sikacagi: "Meyve sıkacağı",
  portakal_sikacagi: "Meyve sıkacağı",
  planet_mikser: "Planet mikser",
  hamur_acma: "Hamur açma makinesi",
};

type TamamlayiciKural = {
  /** Teklifte bunlardan biri varsa… */
  varsa: string[];
  /** …ve bunlar yoksa öne al */
  oner: string[];
  skor: number;
};

/** Teklifte X varken eksik Y — tamamlayıcı öneri */
const TAMAMLAYICI_KURALLAR: TamamlayiciKural[] = [
  {
    varsa: ["espresso_makinasi"],
    oner: ["kahve_degirmeni", "bardak_yikama"],
    skor: 130,
  },
  {
    varsa: ["filter_coffee", "turk_kahve_cift"],
    oner: ["kahve_degirmeni"],
    skor: 110,
  },
  {
    varsa: ["raf_firin", "kombi_firin_6t", "tas_tabanli_firin"],
    oner: ["firin_arabasi"],
    skor: 95,
  },
  {
    varsa: [
      "char_broil",
      "plate_izgara_gaz",
      "dokum_izgara_gaz",
      "komurlu_izgara",
      "fritoz_tek",
      "fritoz_dolapli_elk",
    ],
    oner: ["salamander", "vakum_makinesi"],
    skor: 90,
  },
  {
    varsa: ["kiyma_makinesi", "kemik_testere"],
    oner: ["dilimleme_makinesi", "vakum_makinesi"],
    skor: 95,
  },
  { varsa: ["dilimleme_makinesi"], oner: ["vakum_makinesi"], skor: 75 },
  {
    varsa: ["bar_buzdolabi", "sise_sogutucu_2k", "sise_sogutucu_3k"],
    oner: ["buz_makinesi", "bar_blender"],
    skor: 85,
  },
  { varsa: ["spiral_hamur"], oner: ["planet_mikser", "hamur_acma"], skor: 80 },
  { varsa: ["teshir_vitrin", "sogutma_tezgah"], oner: ["tartim_terazi"], skor: 65 },
  {
    varsa: ["bulasik_giyotin_1000", "bulasik_setalti"],
    oner: ["vakum_makinesi"],
    skor: 55,
  },
];

/** m² bandına göre eksik tip önceliği */
const M2_KURALLAR: Array<{ min: number; oner: string[]; skor: number }> = [
  { min: 120, oner: ["buz_makinesi", "tartim_terazi"], skor: 45 },
  { min: 200, oner: ["bardak_yikama", "vakum_makinesi"], skor: 55 },
  { min: 300, oner: ["dilimleme_makinesi", "salamander"], skor: 50 },
  { min: 350, oner: ["banket_arabasi", "benmari_mobil"], skor: 48 },
];

export type OneriBaglam = {
  mevcutTipKodlari: Set<string>;
  m2?: number;
  eksikZorunluTipKodlari: Set<string>;
};

export function normalizeTipSet(tips: string[]): Set<string> {
  return new Set(
    tips
      .map((t) => resolveTipKodu(String(t ?? "").trim()))
      .filter(Boolean)
      .map((t) => normalizeTipKodu(t)),
  );
}

function etiketTipNorm(label: string): string {
  const tip = yardimciLabelToTip(label);
  return tip ? normalizeTipKodu(tip) : "";
}

function etiketSkoru(
  label: string,
  havuzIndex: number,
  baglam: OneriBaglam,
): number {
  let skor = 1000 - havuzIndex * 8;
  const tipNorm = etiketTipNorm(label);

  if (tipNorm && baglam.mevcutTipKodlari.has(tipNorm)) {
    return skor - 600;
  }

  for (const kural of TAMAMLAYICI_KURALLAR) {
    const tetik = kural.varsa.some((t) =>
      baglam.mevcutTipKodlari.has(normalizeTipKodu(t)),
    );
    if (
      tetik &&
      tipNorm &&
      kural.oner.some((t) => normalizeTipKodu(t) === tipNorm)
    ) {
      skor += kural.skor;
    }
  }

  const m2 = baglam.m2 ?? 0;
  if (m2 > 0) {
    for (const kural of M2_KURALLAR) {
      if (
        m2 >= kural.min &&
        tipNorm &&
        kural.oner.some((t) => normalizeTipKodu(t) === tipNorm)
      ) {
        skor += kural.skor;
      }
    }
  }

  if (tipNorm && baglam.eksikZorunluTipKodlari.has(tipNorm)) {
    skor += 160;
  }

  return skor;
}

function injectBaglamsalEtiketler(
  havuz: string[],
  baglam: OneriBaglam,
): string[] {
  const genisletilmis = [...havuz];
  const ekle = (tip: string) => {
    const norm = normalizeTipKodu(tip);
    if (baglam.mevcutTipKodlari.has(norm)) return;
    const label = ONERI_ETIKET_BY_TIP[norm];
    if (label && !genisletilmis.includes(label)) {
      genisletilmis.unshift(label);
    }
  };

  for (const kural of TAMAMLAYICI_KURALLAR) {
    const tetik = kural.varsa.some((t) =>
      baglam.mevcutTipKodlari.has(normalizeTipKodu(t)),
    );
    if (!tetik) continue;
    for (const tip of kural.oner) ekle(tip);
  }

  const m2 = baglam.m2 ?? 0;
  if (m2 > 0) {
    for (const kural of M2_KURALLAR) {
      if (m2 < kural.min) continue;
      for (const tip of kural.oner) ekle(tip);
    }
  }

  for (const eksik of baglam.eksikZorunluTipKodlari) {
    ekle(eksik);
  }

  return genisletilmis;
}

/** Konsept havuzunu teklif bağlamına göre sırala ve kes */
export function oncelikliYardimciEtiketler(
  havuz: string[],
  baglam: OneriBaglam,
  limit: number,
): string[] {
  const genisletilmis = injectBaglamsalEtiketler(havuz, baglam);

  const skorlu = genisletilmis.map((label, i) => ({
    label,
    skor: etiketSkoru(label, i, baglam),
  }));
  skorlu.sort((a, b) => b.skor - a.skor);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const { label, skor } of skorlu) {
    if (seen.has(label)) continue;
    const tipNorm = etiketTipNorm(label);
    if (tipNorm && baglam.mevcutTipKodlari.has(tipNorm)) continue;
    if (skor < 400) continue;
    seen.add(label);
    result.push(label);
    if (result.length >= limit) return result;
  }

  for (const { label } of skorlu) {
    if (seen.has(label)) continue;
    const tipNorm = etiketTipNorm(label);
    if (tipNorm && baglam.mevcutTipKodlari.has(tipNorm)) continue;
    seen.add(label);
    result.push(label);
    if (result.length >= limit) break;
  }

  return result.slice(0, limit);
}
