/**
 * Ana sayfa Cafemarkt tarzı vitrin — kilitli slider altı.
 * İçerik revizyonu: bu dosyayı düzenleyin.
 */

export type CafemarktPromoCard = {
  id: string;
  brand?: string;
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  legacyGo?: string;
  image?: string;
  bg: string;
  textLight?: boolean;
};

export const cafemarktHeroMain: CafemarktPromoCard = {
  id: "ozti-dual",
  brand: "Öztiryakiler",
  title: "Türkiye'nin en ekonomik tezgah tipi soğutma serisi",
  subtitle: "TAG & GN serisi — canlı fiyat, 9 taksit",
  cta: "Ürünleri gör",
  href: "/shop/sogutma",
  image: "/images/home/hero-sogutma-pisirme-combo.jpg",
  bg: "linear-gradient(135deg, #0d47a1 0%, #1565c0 48%, #42a5f5 100%)",
  textLight: true,
};

export const cafemarktHeroSideTop: CafemarktPromoCard[] = [
  {
    id: "kahve",
    brand: "Kahve",
    title: "La Cimbali & Faema makineleri",
    cta: "Hemen al",
    href: "/shop/kahve",
    image: "/images/home/hero-bar-cocktailstation.png",
    bg: "#eef4fb",
  },
  {
    id: "pfos",
    brand: "Proje Fabrikası",
    title: "Beş dakikada ekipman listesi",
    cta: "Başla",
    href: "/pfos",
    legacyGo: "pfos",
    image: "/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
    bg: "#f3efe6",
  },
];

export const cafemarktHeroSideBottom: CafemarktPromoCard = {
  id: "besos",
  brand: "Bar Design Studio",
  title: "IMT300 berrak buz · modüler kokteyl istasyonu",
  cta: "Alışverişe başla",
  href: "/besos",
  legacyGo: "besos",
  image: "/images/home/hero-bar-cocktailstation.png",
  bg: "#e8eef5",
};

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
    href: "/",
    anchor: "eq-rail-kampanyali",
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
    id: "acik-bufe",
    label: "Açık Büfe Ekipmanları",
    ...shopCat("set-ustu-mutfak", "chafing-dish"),
    image: `${CM_POP_CAT}/cm-acik-bufe-ekipmanlari.jpg`,
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
    image: "/images/home/hero-bar-cocktailstation.png",
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
    id: "dolap",
    label: "Dolaplar",
    ...shopCat("dolap"),
    image: `${OZ_WEB}/ozti-7919-37ntv-c1.jpg`,
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
    image: `${OZ_WEB}/ozti-7897-12050-04.jpg`,
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
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  legacyGo?: string;
  dept?: string;
  image?: string;
  bg: string;
  badge?: string;
  variant: "sm" | "lg" | "tall" | "wide";
  textLight?: boolean;
};

export const cafemarktBentoTiles: CafemarktBentoTile[] = [
  {
    id: "atalay",
    title: "Atalay pişirme serisi",
    cta: "Keşfet",
    href: "/shop/pisirme?marka=Atalay",
    image: "/images/home/hero-sogutma-pisirme-combo.jpg",
    bg: "#eef4fb",
    variant: "sm",
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
