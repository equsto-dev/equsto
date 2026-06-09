/** Marka hub sayfaları — GEO / JSON-LD için SSR metin */
export type BrandHubMeta = {
  displayName: string;
  description: string;
  /** PLP filtre etiketi (oem_brand / facet) */
  facet?: string;
  sameAs?: string[];
};

export const BRAND_HUB_META: Record<string, BrandHubMeta> = {
  oztiryakiler: {
    displayName: "Öztiryakiler Endüstriyel Mutfak",
    description:
      "Equsto, Öztiryakiler endüstriyel mutfak ekipmanları yetkili bayisidir. Pişirme, soğutma, yıkama ve hazırlık hatlarında canlı katalog fiyatları, PFOS proje teklifi ve satış mühendisliği desteği.",
    facet: "Öztiryakiler",
    sameAs: ["https://oztiryakiler.com.tr"],
  },
  atalay: {
    displayName: "Atalay Endüstriyel Mutfak",
    description:
      "Atalay pişirme ve yardımcı ekipmanları Equsto vitrininde. Döner ocak, ızgara ve yerli üretim hatları için katalog fiyatları ve proje bazlı teklif.",
    facet: "Atalay",
    sameAs: ["https://www.atalaymutfak.com"],
  },
  "caglayan-refrigeration": {
    displayName: "Çağlayan Soğutma",
    description:
      "Çağlayan endüstriyel soğutma ekipmanları — tezgah altı, dik tip buzdolabı ve özel imalat soğutma modülleri. Equsto katalog ve PFOS teklif akışı.",
  },
  "proso-profesyonel-sogutma": {
    displayName: "Proso Profesyonel Soğutma",
    description:
      "Proso soğutma ve market reyonu ekipmanları Equsto vitrininde. Soğutmalı teşhir, derin dondurucu ve reyon modülleri için canlı fiyat ve proje teklifi.",
  },
  rational: {
    displayName: "Rational",
    description:
      "Rational kombi fırın, SelfCookingCenter ve iCombi Pro hatları Equsto katalogunda. Öztiryakiler bayi ağı üzerinden canlı fiyat, proje teklifi ve PFOS entegrasyonu.",
    facet: "Rational",
    sameAs: ["https://www.rational-online.com"],
  },
  "robot-coupe": {
    displayName: "Robot Coupe",
    description:
      "Robot Coupe sebze doğrama, blender ve hazırlık makineleri Equsto vitrininde. CL/R serisi ve profesyonel mutfak hazırlık hatları için katalog fiyatları.",
    facet: "Robot Coupe",
    sameAs: ["https://www.robot-coupe.com"],
  },
  wmf: {
    displayName: "WMF",
    description:
      "WMF profesyonel kahve makineleri ve otomatları Equsto katalogunda. Espresso, filtre kahve ve otel/restoran kahve hatları için canlı fiyat ve PFOS teklif.",
    facet: "WMF",
    sameAs: ["https://www.wmf-coffeemachines.com"],
  },
  hoshizaki: {
    displayName: "Hoshizaki",
    description:
      "Hoshizaki buz makinesi, soğutma ve depolama ekipmanları Equsto vitrininde. Öztiryakiler distribütörlüğü ile katalog fiyatları ve proje bazlı teklif.",
    facet: "Hoshizaki",
    sameAs: ["https://www.hoshizaki.com"],
  },
  "nuova-simonelli": {
    displayName: "Nuova Simonelli",
    description:
      "Nuova Simonelli espresso makineleri, Appia ve Oscar serileri Equsto katalogunda. Barista kalitesinde kahve hatları için canlı fiyat ve PFOS proje desteği.",
    facet: "Nuova Simonelli",
    sameAs: ["https://www.nuovasimonelli.it"],
  },
  atese: {
    displayName: "Ateşe",
    description:
      "Ateşe çay kazanları ve demleme ekipmanları Equsto vitrininde. ATS serisi çay hatları için katalog fiyatları ve proje teklifi.",
    facet: "Ateşe",
  },
  unox: {
    displayName: "Unox",
    description:
      "Unox kombi fırın ve pişirme ekipmanları Equsto katalogunda. Profesyonel mutfak pişirme hatları için canlı fiyat ve PFOS entegrasyonu.",
    facet: "Unox",
    sameAs: ["https://www.unox.com"],
  },
  fac: {
    displayName: "FAC",
    description:
      "FAC gıda dilimleme makineleri Equsto vitrininde. Et ve gıda hazırlık hatları için katalog fiyatları ve proje bazlı teklif.",
    facet: "FAC",
  },
  santos: {
    displayName: "Santos",
    description:
      "Santos mutfak hazırlık ve yardımcı ekipmanları Equsto katalogunda. Profesyonel mutfaklar için canlı fiyat ve PFOS teklif akışı.",
    facet: "Santos",
    sameAs: ["https://www.santos.fr"],
  },
  hobart: {
    displayName: "Hobart",
    description:
      "Hobart bulaşık yıkama ve hazırlık ekipmanları Equsto vitrininde. Endüstriyel yıkama hatları için katalog fiyatları ve proje desteği.",
    facet: "Hobart",
    sameAs: ["https://www.hobart.eu"],
  },
  "bravilor-bonamat": {
    displayName: "Bravilor Bonamat",
    description:
      "Bravilor Bonamat filtre kahve makineleri Equsto katalogunda. Otel, restoran ve catering kahve hatları için canlı fiyat ve PFOS teklif.",
    facet: "Bravilor Bonamat",
    sameAs: ["https://www.bravilor.com"],
  },
  vitrifrigo: {
    displayName: "Vitrifrigo",
    description:
      "Vitrifrigo süt soğutucu ve bardak ısıtıcı ekipmanları Equsto vitrininde. Bar ve kahve sunum hatları için katalog fiyatları.",
    facet: "Vitrifrigo",
    sameAs: ["https://www.vitrifrigo.com"],
  },
  bartscher: {
    displayName: "Bartscher",
    description:
      "Bartscher chafing dish ve servis ekipmanları Equsto katalogunda. Profesyonel sunum ve servis hatları için canlı fiyat ve proje teklifi.",
    facet: "Bartscher",
    sameAs: ["https://www.bartscher.com"],
  },
  alkan: {
    displayName: "Alkan",
    description: "Alkan çay ve servis ekipmanları — Öztiryakiler bayi ağı üzerinden Equsto katalogunda.",
    facet: "Alkan",
  },
  fantom: {
    displayName: "Fantom",
    description: "Fantom servis arabaları ve taşıma ekipmanları Equsto vitrininde.",
    facet: "Fantom",
  },
  imperia: {
    displayName: "Imperia",
    description: "Imperia makarna makineleri — profesyonel mutfak hazırlık hatları Equsto katalogunda.",
    facet: "Imperia",
    sameAs: ["https://www.imperia.com"],
  },
  platemate: {
    displayName: "PlateMate",
    description: "PlateMate tabak taşıma arabaları Equsto katalogunda.",
    facet: "PlateMate",
  },
  "hamilton-beach": {
    displayName: "Hamilton Beach",
    description: "Hamilton Beach bar blender ve içecek ekipmanları Equsto vitrininde.",
    facet: "Hamilton Beach",
    sameAs: ["https://www.hamiltonbeach.com"],
  },
  menumaster: {
    displayName: "MenuMaster",
    description: "MenuMaster mikrodalga ve hızlı pişirme ekipmanları Equsto katalogunda.",
    facet: "MenuMaster",
  },
  tribeca: {
    displayName: "Tribeca",
    description: "Tribeca termobox ve taşıma ekipmanları Equsto vitrininde.",
    facet: "Tribeca",
  },
  dualit: {
    displayName: "Dualit",
    description: "Dualit ekmek kızartma makineleri Equsto katalogunda.",
    facet: "Dualit",
    sameAs: ["https://www.dualit.com"],
  },
  swedlinghaus: {
    displayName: "Swedlinghaus",
    description: "Swedlinghaus et hazırlık ekipmanları Equsto vitrininde.",
    facet: "Swedlinghaus",
  },
  vesta: {
    displayName: "Vesta",
    description: "Vesta sous vide ve pişirme ekipmanları Equsto katalogunda.",
    facet: "Vesta",
  },
  copmak: {
    displayName: "Copmak",
    description: "Copmak çöp öğütme makineleri Equsto vitrininde.",
    facet: "Copmak",
  },
  blanco: {
    displayName: "Blanco",
    description: "Blanco çöp öğütücü ve mutfak ekipmanları Equsto katalogunda.",
    facet: "Blanco",
    sameAs: ["https://www.blanco.com"],
  },
  simag: {
    displayName: "SIMAG",
    description: "SIMAG buz makineleri — Öztiryakiler bayi ağı üzerinden Equsto katalogunda.",
    facet: "SIMAG",
  },
  electrolux: {
    displayName: "Electrolux Professional",
    description:
      "Electrolux Professional modüler pişirme (700XP/900XP), SkyLine fırınlar, green&clean bulaşık hatları ve ecostore soğutma — resmi katalog verisi, teknik özellikler ve veri sayfaları Equsto vitrininde.",
    facet: "Electrolux",
    sameAs: ["https://www.electroluxprofessional.com/tr/"],
  },
  senox: {
    displayName: "Şenox",
    description:
      "Şenox soğutma, teşhir, hazırlık ve içecek ekipmanları Equsto vitrininde. Mutbex katalog verisi ile kademeli güncellenen ürün listesi, canlı fiyat ve PFOS proje teklifi.",
    facet: "Şenox",
    sameAs: ["https://www.senox.com.tr"],
  },
  vosco: {
    displayName: "Vosco",
    description:
      "Vosco buz makineleri, teşhir dolapları, kahve ve hazırlık ekipmanları — vosco.com.tr katalog verisi ve 2026 PDF liste fiyatları ile Equsto vitrininde.",
    facet: "Vosco",
    sameAs: ["https://vosco.com.tr"],
  },
};

export function getBrandHubMeta(slug: string): BrandHubMeta | null {
  return BRAND_HUB_META[slug] ?? null;
}

export function brandHubFacet(slug: string): string {
  const hub = getBrandHubMeta(slug);
  if (hub?.facet) return hub.facet;
  return brandHubLabel(slug);
}

export function brandHubLabel(slug: string): string {
  return (
    getBrandHubMeta(slug)?.displayName ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
