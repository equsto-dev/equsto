/** Marka hub sayfaları — GEO / JSON-LD için SSR metin */
export type BrandHubMeta = {
  displayName: string;
  description: string;
  sameAs?: string[];
};

export const BRAND_HUB_META: Record<string, BrandHubMeta> = {
  oztiryakiler: {
    displayName: "Öztiryakiler Endüstriyel Mutfak",
    description:
      "Equsto, Öztiryakiler endüstriyel mutfak ekipmanları yetkili bayisidir. Pişirme, soğutma, yıkama ve hazırlık hatlarında canlı katalog fiyatları, PFOS proje teklifi ve satış mühendisliği desteği.",
    sameAs: ["https://oztiryakiler.com.tr"],
  },
  atalay: {
    displayName: "Atalay Endüstriyel Mutfak",
    description:
      "Atalay pişirme ve yardımcı ekipmanları Equsto vitrininde. Döner ocak, ızgara ve yerli üretim hatları için katalog fiyatları ve proje bazlı teklif.",
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
};

export function getBrandHubMeta(slug: string): BrandHubMeta | null {
  return BRAND_HUB_META[slug] ?? null;
}

export function brandHubLabel(slug: string): string {
  return (
    getBrandHubMeta(slug)?.displayName ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
