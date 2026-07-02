/** Yardımcı ekipman etiketi → PFOS tip_kodu (pfos-tip-shop-links / matchShopCatalog) */

const YARDIMCI_LABEL_TIP: Record<string, string> = {
  "Gıda dilimleme makinası": "dilimleme_makinesi",
  "Vakum makinası": "vakum_makinesi",
  "Şarap dolabı": "bar_buzdolabi",
  "Benmari (sos)": "benmari_set",
  "Salamander": "salamander",
  "Dry-aged dolabı": "dry_age_dolabi",
  "Tartı seti": "tartim_terazi",
  "Tartı (hassas)": "tartim_terazi",
  "Et dilimleme makinası": "dilimleme_makinesi",
  "Et dilimleme makinesi": "dilimleme_makinesi",
  "Mutfak arabası": "firin_arabasi",
  "Soğutmalı teşhir vitrin": "teshir_vitrin",
  "Teşhir vitrin": "teshir_vitrin",
  "Dilimleme makinası": "dilimleme_makinesi",
  "Et kıyma (ilave)": "kiyma_makinesi",
  "Balık teşhir tezgahı": "sogutma_tezgah",
  "Buz makinası (ilave)": "buz_makinesi",
  "Buz makinası": "buz_makinesi",
  "Kahve değirmeni (reserve)": "kahve_degirmeni",
  "Bardak yıkayıcı": "bardak_yikama",
  "Blender seti": "bar_blender",
  "Hamur yoğurma (ilave)": "spiral_hamur",
  "Spiral hamur yoğurma": "spiral_hamur",
  "Hamur açma makinesi": "hamur_acma",
  "Meze hazırlık tezgahı": "calisma_tezgahi",
  "Benmari seti": "benmari_set",
  "Servis arabası": "cop_arabasi",
  "Taşıma arabaları": "cop_arabasi",
  "Çöp arabaları": "cop_arabasi",
  "Sarf malzeme rafı": "servis_rafi",
  "İstif rafı seti": "duvar_rafi",
  "Fritöz (yedek)": "fritoz_tek",
};

export function yardimciLabelToTip(label: string): string | null {
  const key = label.trim();
  if (!key) return null;
  if (YARDIMCI_LABEL_TIP[key]) return YARDIMCI_LABEL_TIP[key];
  const lc = key.toLocaleLowerCase("tr");
  if (lc.includes("vakum")) return "vakum_makinesi";
  if (lc.includes("dilimleme")) return "dilimleme_makinesi";
  if (lc.includes("buz makina")) return "buz_makinesi";
  if (lc.includes("salamander")) return "salamander";
  if (lc.includes("hamur yoğur") || lc.includes("spiral")) return "spiral_hamur";
  if (lc.includes("hamur aç")) return "hamur_acma";
  if (lc.includes("teşhir") || lc.includes("teshir")) return "teshir_vitrin";
  if (lc.includes("bardak yıka")) return "bardak_yikama";
  if (lc.includes("kahve değir")) return "kahve_degirmeni";
  if (lc.includes("fritöz") || lc.includes("fritoz")) return "fritoz_tek";
  if (lc.includes("tartı") || lc.includes("tarti") || lc.includes("terazi")) return "tartim_terazi";
  if (lc.includes("dry age") || lc.includes("dry-age") || lc.includes("dry aged")) return "dry_age_dolabi";
  if (lc.includes("arabası") || lc.includes("arabasi")) return "firin_arabasi";
  return null;
}
