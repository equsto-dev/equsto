import type { BesosLocale } from "./locale";

const UI = {
  methodAria: { tr: "Yöntemimiz", en: "Our method" },
  methodKicker: { tr: "Yöntemimiz", en: "Our method" },
  videoAria: { tr: "Bar stüdyo videosu", en: "Bar studio video" },
  browseModules: { tr: "Modülleri incele", en: "Browse modules" },
  requestQuote: { tr: "Proje teklifi al", en: "Request a project quote" },
  signatureAria: { tr: "İmza barlar", en: "Signature bars" },
  signatureKicker: { tr: "Equsto Bar Studio imza barları", en: "Equsto Bar Studio signature bars" },
  signatureTitle: { tr: "İmza barlar", en: "Signature bars" },
  signatureMediaPh: { tr: "Görsel", en: "Image" },
  modulePage: { tr: "Modül sayfası →", en: "Module page →" },
  modularAria: { tr: "Modüler sistem", en: "Modular system" },
  modularMore: { tr: "+ daha fazlası", en: "+ more" },
  modularCta: { tr: "42 modülü keşfet →", en: "Explore 42 modules →" },
  serveAria: {
    tr: "Size hizmet etmek için tasarlanmış sistem",
    en: "A system designed to serve you",
  },
  catalogAria: { tr: "Bar modülleri kataloğu", en: "Bar modules catalogue" },
  catalogSearchClear: { tr: "Aramayı temizle", en: "Clear search" },
  catalogSearchMatch: { tr: "eşleşen ürün", en: "matching products" },
  catalogCategory: { tr: "Kategori", en: "Category" },
  catalogProducts: { tr: "ürün", en: "products" },
  catalogPage: { tr: "Sayfa", en: "Page" },
  catalogImagePh: { tr: "Görsel", en: "Image" },
  catalogModuleDefault: { tr: "Bar modülü", en: "Bar module" },
  addToCart: { tr: "Sepete Ekle", en: "Add to cart" },
  contact: { tr: "İletişim", en: "Contact" },
  totalDimensions: { tr: "Total", en: "Total" },
  projectsAria: { tr: "Bar projeleri", en: "Bar projects" },
  projectsKicker: { tr: "Öne çıkan projeler", en: "Featured projects" },
  projectsTitle: { tr: "Öne çıkan projeler", en: "Featured projects" },
  projectsLead: {
    tr: "Saha projeleri ve Equsto Bar Studio katalog modülleri yan yana.",
    en: "Reference projects and Equsto Bar Studio catalogue modules side by side.",
  },
  venueTag: { tr: "Mekan", en: "Venue" },
  studioModuleTag: { tr: "Equsto Bar Studio modülü", en: "Equsto Bar Studio module" },
  moduleNotFound: { tr: "Modül bulunamadı", en: "Module not found" },
  vitrumProject: { tr: "Vitrum proje sayfası ↗", en: "Vitrum project page ↗" },
  besosModule: { tr: "Besos modül", en: "Besos module" },
  catalogKicker: { tr: "Katalog", en: "Catalogue" },
  otherModules: {
    tr: "Katalogdan diğer modüller",
    en: "Other modules from the catalogue",
  },
  priceVatIncluded: { tr: "KDV dahil", en: "incl. VAT" },
} as const;

export type BesosUiKey = keyof typeof UI;

export function besosUi(key: BesosUiKey, locale: BesosLocale): string {
  return UI[key][locale];
}

export function besosUiWithBrand(key: "projectsLead", locale: BesosLocale, brand: string): string {
  if (key === "projectsLead" && locale === "tr") {
    return `Saha projeleri ve ${brand} katalog modülleri yan yana.`;
  }
  if (key === "projectsLead" && locale === "en") {
    return `Reference projects and ${brand} catalogue modules side by side.`;
  }
  return besosUi(key, locale);
}
