/**
 * Ana sayfa Cafemarkt tarzı vitrin — kilitli slider altı.
 * Hero kutuları KİLİTLİ: public/home-cafemarkt-hero-KILIT.txt
 * Kategori + bento içeriği revize edilebilir.
 */

export type CafemarktPromoCard = {
  id: string;
  brand?: string;
  title: string;
  subtitle?: string;
  /** Electrolux XP tarzı split vitrin */
  layout?: "default" | "split";
  promoKicker?: string;
  titleEm?: string;
  promoLead?: string;
  promoBadges?: readonly string[];
  promoPoints?: readonly string[];
  cta: string;
  href: string;
  legacyGo?: string;
  image?: string;
  bg: string;
  textLight?: boolean;
};

/** Öztiryakiler 79E3.37NMV.03 — oztiryakiler.com.tr ürün sayfası teknik tablosu */
export const cafemarktHeroMain: CafemarktPromoCard = {
  id: "ozti-dual",
  layout: "split",
  promoKicker: "Öztiryakiler · tezgah tipi soğutma · TAG 370 NMV",
  title: "9 Çekmeceli",
  titleEm: "Yatay Tip Buzdolabı",
  promoLead:
    "GN 1/1 uyumlu dokuz çekmeceli tezgah tipi buzdolabı — profesyonel mutfaklarda erişilebilir soğutma, HACCP dijital kontrol ve yüksek verimli monoblok soğutma sistemi.",
  promoBadges: ["GN 1/1", "9 çekmeceli", "-2/+8 °C", "457 L", "304 paslanmaz"],
  cta: "Ürün sayfasına git →",
  href: "/shop/sogutma/oztiryakiler-endustriyel-mutfak__79e3-37nmv-03",
  image: "/images/catalog/ozti/web/ozti-79e3-37nmv-03-cutout.png",
  bg: "#001e50",
  textLight: true,
};

export const cafemarktHeroSide: CafemarktPromoCard[] = [
  {
    id: "kahve",
    brand: "Nuova Simonelli",
    title: "NUOSI APPIA LIFE 3 gruplu kahve makinası",
    cta: "Hemen al",
    href: "/shop/kahve?tip=espresso-makinesi&marka=Nuova+Simonelli",
    image: "/images/catalog/ozti/web/ozti-9580-appia-3v.jpg",
    bg: "#eef4fb",
  },
  {
    id: "yikama",
    brand: "Öztiryakiler",
    title: "Tezgahaltı bulaşık yıkama makinesi",
    subtitle: "OBY 50T Touch — setaltı profesyonel yıkama",
    cta: "Hemen al",
    href: "/shop/yikama?tip=setalti-bulasik",
    image: "/images/catalog/ozti/web/ozti-075t-00010-ad.jpg",
    bg: "#f3efe6",
  },
  {
    id: "pisirme-ocak",
    brand: "Öztiryakiler",
    title: "Set üstü dörtlü ocak",
    subtitle: "900 serisi gazlı — 80×90 cm",
    cta: "Pişirme vitrini",
    href: "/shop/pisirme?tip=ocak-vitrini",
    image: "/images/catalog/ozti/web/ozti-7865-n1-80903-20.jpg",
    bg: "#e8eef5",
  },
  {
    id: "pisirme-firin",
    brand: "Öztiryakiler",
    title: "Pizza fırını",
    subtitle: "Profesyonel pişirme hattı",
    cta: "Keşfet",
    href: "/shop/pisirme?tip=pizza-firinlari",
    image: "/images/home/pop-cats/cm-pizza-firinlari.webp",
    bg: "#f5f0ea",
  },
];

export type CafemarktCategory = {
  id: string;
  label: string;
  href: string;
  dept?: string;
  legacyGo?: string;
  tip?: string;
  /** Ana sayfada kaydırılacak bölüm (kampanya vb.) */
  anchor?: string;
  image: string;
};

/** /shop/{dept} veya ?tip= alt kategori */
function shopCat(dept: string, tip?: string): Pick<CafemarktCategory, "href" | "dept" | "tip"> {
  return {
    href: tip ? `/shop/${dept}?tip=${encodeURIComponent(tip)}` : `/shop/${dept}`,
    dept,
    tip,
  };
}

/** Cafemarkt vitrin — witcdn slider-2601…12 (scripts/fetch-cafemarkt-home-pop-cats.mjs) */
const CM_POP_CAT = "/images/home/pop-cats";
/** Katalog PDF sayfası değil — beyaz zemin ürün foto (ozti/web, atalay/cafemarkt) */
const OZ_WEB = "/images/catalog/ozti/web";

const cafemarktPopCats: CafemarktCategory[] = [
  {
    id: "hazirlik-mak",
    label: "Hazırlık Makineleri",
    ...shopCat("hazirlik"),
    image: `${CM_POP_CAT}/cm-hazirlik-makineleri.png`,
  },
  {
    id: "kampanya",
    label: "Kampanyalar",
    href: "/#eq-rail-kampanyali",
    image: `${CM_POP_CAT}/cm-kampanyalar.webp`,
  },
  {
    id: "outlet",
    label: "Outlet Ürünler",
    ...shopCat("sogutma", "tezgah-tipi-buzdolabi"),
    image: `${CM_POP_CAT}/cm-outlet-urunler.jpg`,
  },
  {
    id: "bulasikhane",
    label: "Bulaşıkhane Ekipmanları",
    ...shopCat("yikama", "konveyorlu-bulasik"),
    image: `${CM_POP_CAT}/cm-bulasikhane-ekipmanlari.png`,
  },
  {
    id: "gastronorm",
    label: "Gastronorm Küvetler",
    ...shopCat("kuvetler", "gastronorm-kuvet"),
    image: `${CM_POP_CAT}/cm-gastronorm-kuvetler.jpg`,
  },
  {
    id: "cay",
    label: "Çay Makineleri",
    ...shopCat("icecek", "cay-makinesi"),
    image: `${CM_POP_CAT}/cm-cay-makineleri.png`,
  },
  {
    id: "soguk-teshir",
    label: "Soğuk Teşhir Dolapları",
    ...shopCat("market-reyonlari", "soguk-teshir"),
    image: `${CM_POP_CAT}/cm-soguk-teshir-dolaplari.png`,
  },
  {
    id: "bar-blender",
    label: "Bar Blenderları",
    ...shopCat("icecek", "bar-blender"),
    image: `${CM_POP_CAT}/cm-bar-blenderlari.jpg`,
  },
  {
    id: "pizza",
    label: "Pizza Fırınları",
    ...shopCat("pisirme", "pizza-firinlari"),
    image: `${CM_POP_CAT}/cm-pizza-firinlari.webp`,
  },
  {
    id: "filtre-kahve",
    label: "Filtre Kahve Makineleri",
    ...shopCat("kahve", "filtre-kahve"),
    image: `${CM_POP_CAT}/cm-filtre-kahve-makineleri.jpg`,
  },
  {
    id: "kahve-degirmeni",
    label: "Kahve Değirmenleri",
    ...shopCat("kahve", "kahve-degirmeni"),
    image: `${CM_POP_CAT}/cm-kahve-degirmenleri.webp`,
  },
];

/** Sol menü departmanları — Cafemarkt listesine ek (cm-* + ozti/web ürün foto) */
const equstoDeptCats: CafemarktCategory[] = [
  {
    id: "pfos",
    label: "Proje Fabrikası",
    href: "/pfos",
    legacyGo: "pfos",
    image: "/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
  },
  {
    id: "besos",
    label: "Bar Design",
    href: "/besos",
    legacyGo: "besos",
    /** Popüler Kategoriler — beyaz zemin (gri kaynak: hero-bar-cocktailstation.png) */
    image: "/images/home/hero-bar-cocktailstation-popcat-white.png",
  },
  {
    id: "pisirme",
    label: "Pişirme Ekipmanları",
    ...shopCat("pisirme"),
    image: `${CM_POP_CAT}/cm-pizza-firinlari.webp`,
  },
  {
    id: "sogutma",
    label: "Soğutma Ekipmanları",
    ...shopCat("sogutma"),
    image: `${OZ_WEB}/ozti-7919-06nmv-00.jpg`,
  },
  {
    id: "kahve",
    label: "Kahve Ekipmanları",
    ...shopCat("kahve"),
    image: `${CM_POP_CAT}/cm-filtre-kahve-makineleri.jpg`,
  },
  {
    id: "yikama",
    label: "Yıkama Ekipmanları",
    ...shopCat("yikama"),
    image: `${CM_POP_CAT}/cm-bulasikhane-ekipmanlari.png`,
  },
  {
    id: "hazirlik",
    label: "Hazırlık Ekipmanları",
    ...shopCat("hazirlik"),
    image: `${CM_POP_CAT}/cm-hazirlik-makineleri.png`,
  },
  {
    id: "icecek",
    label: "İçecek Ekipmanları",
    ...shopCat("icecek"),
    image: `${CM_POP_CAT}/cm-cay-makineleri.png`,
  },
  {
    id: "servis",
    label: "Servis & Teşhir",
    href: "/shop/market-reyonlari",
    legacyGo: "marketReyon",
    image: `${CM_POP_CAT}/cm-soguk-teshir-dolaplari.png`,
  },
  {
    id: "tezgah",
    label: "Tezgahlar",
    ...shopCat("tezgah"),
    image: `${CM_POP_CAT}/tezgah-taban-ara-rafli.jpg`,
  },
  {
    id: "davlumbaz",
    label: "Davlumbazlar",
    ...shopCat("davlumbaz"),
    image: `${OZ_WEB}/ozti-7885-15155-10.jpg`,
  },
  {
    id: "araba",
    label: "Arabalar",
    ...shopCat("araba"),
    image: `${CM_POP_CAT}/araba-tepsi-tasima-gn.jpg`,
  },
  {
    id: "istif",
    label: "İstif Rafları",
    ...shopCat("istif"),
    image: `${CM_POP_CAT}/istif-izgara-tel.jpg`,
  },
  {
    id: "kuvetler",
    label: "Küvetler",
    ...shopCat("kuvetler"),
    image: `${CM_POP_CAT}/cm-gastronorm-kuvetler.jpg`,
  },
];

export const cafemarktCategories: CafemarktCategory[] = [
  ...cafemarktPopCats,
  ...equstoDeptCats,
];

export type CafemarktBentoTile = {
  id: string;
  brand?: string;
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  legacyGo?: string;
  dept?: string;
  image?: string;
  showcase?: readonly { tag: string; image: string }[];
  bg: string;
  badge?: string;
  variant: "sm" | "lg" | "tall" | "wide";
  textLight?: boolean;
};

export const cafemarktBentoTiles: CafemarktBentoTile[] = [
  {
    id: "atalay",
    brand: "Atalay",
    title: "Atalay pişirme serisi",
    subtitle: "Izgara · fritöz · ocak — Seri 600",
    cta: "Keşfet",
    href: "/shop/pisirme?marka=Atalay",
    bg: "linear-gradient(135deg, #eef4fb 0%, #e3edf9 55%, #dce8f5 100%)",
    variant: "sm",
    showcase: [
      {
        tag: "Gazlı plaka",
        image: "/images/catalog/atalay/cafemarkt/atalay-e-agi---1060.jpg",
      },
      {
        tag: "Elektrikli ızgara",
        image: "/images/catalog/atalay/cafemarkt/atalay-e-aei---660.jpg",
      },
      {
        tag: "Fritöz",
        image: "/images/catalog/atalay/cafemarkt/atalay-e-aef---660.jpg",
      },
    ],
  },
  {
    id: "yikama",
    title: "Liva ön yıkama sistemleri",
    subtitle: "Hijyen hattı",
    cta: "İncele",
    href: "/shop/yikama",
    dept: "yikama",
    image: "/images/home/hero-yer-sofrasi-bufe.png",
    bg: "#e3f2fd",
    badge: "Aynı gün kargo",
    variant: "tall",
  },
  {
    id: "yaz",
    title: "Yaz fırsatları",
    subtitle: "Pişirme · soğutma · kahve",
    cta: "Hemen keşfet",
    href: "/shop/pisirme",
    image: "/images/home/hero-sogutma-pisirme-combo.jpg",
    bg: "linear-gradient(145deg, #ffd54f 0%, #ffb300 42%, #0d47a1 100%)",
    variant: "lg",
    textLight: true,
  },
  {
    id: "kahve-silo",
    title: "Kahve siloları & öğütücüler",
    cta: "Kahve",
    href: "/shop/kahve",
    dept: "kahve",
    bg: "#efebe9",
    variant: "sm",
  },
  {
    id: "gtech",
    title: "El blender modelleri",
    cta: "Gtech",
    href: "/shop/hazirlik?marka=Gtech",
    image: "/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
    bg: "#eceff1",
    badge: "Aynı gün kargo",
    variant: "tall",
  },
  {
    id: "ozti-marka",
    title: "Equsto'da avantajlı fiyatlar",
    subtitle: "Su filtrasyon · markalar",
    cta: "Keşfet",
    href: "/shop/marka/oztiryakiler",
    bg: "#fff8e1",
    variant: "sm",
  },
];
