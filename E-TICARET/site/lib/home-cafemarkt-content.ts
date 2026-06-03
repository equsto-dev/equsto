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

/** Cafemarkt vitrin sırası (canlı cafemarkt.com — slider #260) */
const cafemarktPopCats: CafemarktCategory[] = [
  {
    id: "hazirlik-mak",
    label: "Hazırlık Makineleri",
    ...shopCat("hazirlik"),
    image: "/images/catalog/ozti/web/ozti-0820-00030-11.jpg",
  },
  {
    id: "kampanya",
    label: "Kampanyalar",
    href: "/",
    anchor: "eq-rail-kampanyali",
    image: "/images/home/pop-cat-kampanya.svg",
  },
  {
    id: "outlet",
    label: "Outlet Ürünler",
    ...shopCat("sogutma", "tezgah-tipi-buzdolabi"),
    image: "/images/home/pop-cat-outlet.svg",
  },
  {
    id: "bulasikhane",
    label: "Bulaşıkhane Ekipmanları",
    ...shopCat("yikama", "konveyorlu-bulasik"),
    image: "/images/catalog/ozti/web/ozti-076r-00100-bd.jpg",
  },
  {
    id: "gastronorm",
    label: "Gastronorm Küvetler",
    ...shopCat("kuvetler", "gastronorm-kuvet"),
    image: "/images/catalog/ozti/web/ozti-0311-11065-10.jpg",
  },
  {
    id: "acik-bufe",
    label: "Açık Büfe Ekipmanları",
    ...shopCat("set-ustu-mutfak", "chafing-dish"),
    image: "/images/catalog/atalay/cafemarkt/atalay-gn-11-150.jpg",
  },
  {
    id: "cay",
    label: "Çay Makineleri",
    ...shopCat("icecek", "cay-makinesi"),
    image: "/images/catalog/ozti/web/ozti-8574-cm080-00.jpg",
  },
  {
    id: "soguk-teshir",
    label: "Soğuk Teşhir Dolapları",
    ...shopCat("market-reyonlari", "soguk-teshir"),
    image: "/images/catalog/ozti/web/ozti-7912-15070-o0.jpg",
  },
  {
    id: "bar-blender",
    label: "Bar Blenderları",
    ...shopCat("icecek", "bar-blender"),
    image: "/images/catalog/ozti/web/ozti-9563-cb699-0d.jpg",
  },
  {
    id: "pizza",
    label: "Pizza Fırınları",
    ...shopCat("pisirme", "pizza-firinlari"),
    image: "/images/catalog/ozti/web/ozti-8890-p5050-01.jpg",
  },
  {
    id: "filtre-kahve",
    label: "Filtre Kahve Makineleri",
    ...shopCat("kahve", "filtre-kahve"),
    image: "/images/catalog/ozti/web/ozti-8574-fm250-00.jpg",
  },
  {
    id: "kahve-degirmeni",
    label: "Kahve Değirmenleri",
    ...shopCat("kahve", "kahve-degirmeni"),
    image: "/images/catalog/ozti/cafemarkt/ozti-9584-00mdx-00.jpg",
  },
];

/** Sol menü departmanları — Cafemarkt listesine ek */
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
    image: "/images/catalog/atalay/p7/atalay-e-aei---360.jpg",
  },
  {
    id: "sogutma",
    label: "Soğutma Ekipmanları",
    ...shopCat("sogutma"),
    image: "/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg",
  },
  {
    id: "kahve",
    label: "Kahve Ekipmanları",
    ...shopCat("kahve"),
    image: "/images/catalog/ozti/p453/ozti-8593-su080-00.jpg",
  },
  {
    id: "yikama",
    label: "Yıkama Ekipmanları",
    ...shopCat("yikama"),
    image: "/images/catalog/ozti/p238/ozti-7711-07075-24.jpg",
  },
  {
    id: "hazirlik",
    label: "Hazırlık Ekipmanları",
    ...shopCat("hazirlik"),
    image: "/images/catalog/ozti/p135/ozti-9810-hl200-21.jpg",
  },
  {
    id: "icecek",
    label: "İçecek Ekipmanları",
    ...shopCat("icecek"),
    image: "/images/catalog/ozti/p453/ozti-8593-su080-00.jpg",
  },
  {
    id: "servis",
    label: "Servis & Teşhir",
    href: "/shop/market-reyonlari",
    legacyGo: "marketReyon",
    image: "/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg",
  },
  {
    id: "dolap",
    label: "Dolaplar",
    ...shopCat("dolap"),
    image: "/images/catalog/ozti/p238/ozti-7711-07075-24.jpg",
  },
  {
    id: "davlumbaz",
    label: "Davlumbazlar",
    ...shopCat("davlumbaz"),
    image: "/images/catalog/atalay/p7/atalay-e-aei---360.jpg",
  },
  {
    id: "tasima",
    label: "Taşıma Ekipmanları",
    ...shopCat("tasima"),
    image: "/images/catalog/atalay/p7/atalay-e-aei---360.jpg",
  },
  {
    id: "araba",
    label: "Arabalar",
    ...shopCat("araba"),
    image: "/images/catalog/atalay/p117/atalay-adk-102.jpg",
  },
  {
    id: "istif",
    label: "İstif Rafları",
    ...shopCat("istif"),
    image: "/images/catalog/atalay/p117/atalay-adk-102.jpg",
  },
  {
    id: "kuvetler",
    label: "Küvetler",
    ...shopCat("kuvetler"),
    image: "/images/catalog/ozti/p238/ozti-7711-07075-24.jpg",
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
