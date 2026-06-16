/** Konsept / dükkan türüne göre opsiyonel yardımcı ekipman (pfos-wizard.js YARDIMCI ile uyumlu) */

const YARDIMCI_EKIPMAN: Record<string, readonly string[]> = {
  "Fine Dining": [
    "Gıda dilimleme makinası",
    "Vakum makinası",
    "Şarap dolabı",
    "Benmari (sos)",
    "Tartı (hassas)",
    "Salamander",
  ],
  Steakhouse: [
    "Dry-aged dolabı",
    "Et dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
  ],
  "Gurme Şarküteri": [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Et kıyma (ilave)",
  ],
  "Şarküteri Restoran": [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Masa servisi ekipmanı",
  ],
  Şarküteri: [
    "Soğutmalı teşhir vitrin",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Benmari (sos)",
    "Et kıyma (ilave)",
  ],
  "Balık Restaurant": [
    "Balık teşhir tezgahı",
    "Buz makinası (ilave)",
    "Vakum makinası",
    "Dilimleme makinası",
    "Tartı seti",
  ],
  Cafe: [
    "Kahve değirmeni (reserve)",
    "Su filtresi",
    "Bardak yıkayıcı",
    "Blender seti",
    "Termos seti",
    "Buz makinası",
  ],
  "Kafe-Kafeterya": [
    "Kahve değirmeni (reserve)",
    "Su filtresi",
    "Bardak yıkayıcı",
    "Blender seti",
    "Termos seti",
  ],
  "Bulut Mutfak": [
    "Vakum makinası",
    "Termal çanta seti",
    "Gıda folyo makinası",
    "Tartı seti",
    "Mutfak arabası",
  ],
  Hotel: [
    "Isıtıcı arabalar (banket)",
    "Salata bar ekipmanları",
    "Tabak ısıtıcı",
    "Chafing dish seti",
    "Termos dispenserler",
  ],
  Bar: [
    "Buz kırıcı (ilave)",
    "Meyve sıkacağı",
    "Bardak yıkayıcı",
    "Speed rail",
    "Kokteyl seti",
  ],
  "Pastane & Patisserie": [
    "Hamur yoğurma (ilave)",
    "Dilimleme makinası",
    "Vakum makinası",
    "Tartı (hassas)",
    "Teşhir vitrin",
    "Buz makinası",
  ],
  Meyhane: [
    "Buz makinası (ilave)",
    "Meze hazırlık tezgahı",
    "Vakum makinası",
    "Benmari seti",
    "Tartı seti",
    "Servis arabası",
  ],
  Kebapçı: [
    "Döner motoru (yedek)",
    "Tartı seti",
    "Vakum makinası",
    "Mutfak arabası",
    "Salamander",
    "Izgara yedek seti",
  ],
  "Kanatçı-Kebapçı": [
    "Piliç çevirme makinesi (yedek)",
    "Tartı seti",
    "Vakum makinası",
    "Mutfak arabası",
    "Salamander",
    "Izgara yedek seti",
    "Fritöz (yedek)",
  ],
  Catering: [
    "Taşıma arabaları",
    "Thermobox seti",
    "Sarf malzeme rafı",
    "İstif rafı seti",
    "Çöp arabaları",
  ],
  Fastfood: [
    "Vakum makinası",
    "Fritöz (yedek)",
    "Tartı seti",
    "Mutfak arabası",
    "Salamander",
    "Buz makinası",
  ],
  Pizzacı: [
    "Spiral hamur yoğurma",
    "Hamur açma makinesi",
    "Pizza tepsisi & kürek seti",
    "Vakum makinası",
    "Tartı seti",
    "Buz makinası",
  ],
  Dönerci: [
    "Döner kesme makinesi",
    "Et dilimleme makinesi",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
    "Salamander",
  ],
  default: [
    "Gıda dilimleme makinası",
    "Vakum makinası",
    "Tartı seti",
    "Mutfak arabası",
    "Bıçak sterilizatörü",
  ],
};

export const PFOS_ELK_GAZ_SECENEKLERI = [
  "Doğalgaz bağlantısı mevcut",
  "Elektrik trifaze 380V mevcut",
  "LPG kullanılacak",
  "Hem doğalgaz hem trifaze mevcut",
] as const;

function yardimciKey(
  dukkanTuru: string,
  ustSegment: string,
): keyof typeof YARDIMCI_EKIPMAN {
  const d = dukkanTuru.trim();
  if (d && YARDIMCI_EKIPMAN[d]) return d;
  const s = ustSegment.trim();
  if (s && YARDIMCI_EKIPMAN[s]) return s;
  return "default";
}

/** En fazla 6 öneri — legacy sihirbaz ile aynı */
export function yardimciEkipmanForKonsept(
  dukkanTuru: string,
  ustSegment = "",
): string[] {
  const key = yardimciKey(dukkanTuru, ustSegment);
  return [...(YARDIMCI_EKIPMAN[key] ?? YARDIMCI_EKIPMAN.default)].slice(0, 6);
}
