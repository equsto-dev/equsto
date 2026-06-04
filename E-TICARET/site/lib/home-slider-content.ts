/** Ana sayfa alt slider — PFOS · Bar · Soğutma · IMT300 (kilit: public/home-main-slider-KILIT.txt) */

export const homeMainSliderPfosImage = {
  path: "/images/pfos/proje-fabrikasi-bar-plan-eskiz.png",
  width: 1024,
  height: 331,
} as const;

export const homeMainSliderSogutmaPisirmeImage = {
  path: "/images/home/hero-sogutma-pisirme-combo.jpg",
  width: 2048,
  height: 1044,
} as const;

export const homeMainSliderBarImage = {
  path: "/images/home/hero-bar-cocktailstation.png",
  width: 1200,
  height: 713,
} as const;

export const homeMainSliderImt300Image = {
  path: "/images/imt300/imt300-1.jpg",
  width: 800,
  height: 600,
} as const;

/** Manhattan PDP tamamlayıcıları — vitrum-bars-catalogue.json */
export const homeMainSliderBesosComplements = [
  {
    name: "The Manhattan",
    code: "BES-P23",
    href: "/besos/modul/the-manhattan",
    image: "/images/catalog/besos/web/besos-bes-p23.avif",
  },
  {
    name: "The Boulverdier",
    code: "BES-P24",
    href: "/besos/modul/the-boulverdier",
    image: "/images/catalog/besos/web/besos-bes-p24.avif",
  },
  {
    name: "The Clover",
    code: "BES-P25",
    href: "/besos/modul/the-clover",
    image: "/images/catalog/besos/web/besos-bes-p25.avif",
  },
  {
    name: "Bar Module",
    code: "PL/BM.F.3.1-18",
    href: "/besos/modul/pl-bm-f-3-1-18",
    image: "/images/catalog/besos/pdf/besos-pl-bm-f-3-1-18.png",
  },
] as const;

export type HomeMainSliderSlide =
  | {
      id: "pfos";
      href: string;
      slideClass: string;
      title: string;
      subtitle: string;
      cta: string;
      thumbLabel: string;
      kind: "pfos-img";
      image: typeof homeMainSliderPfosImage;
    }
  | {
      id: "sogutma";
      href: string;
      slideClass?: string;
      title: string;
      subtitle: string;
      cta: string;
      thumbLabel: string;
      kind: "background";
      background: string;
      thumbSrc: string;
    }
  | {
      id: "besos";
      href: string;
      slideClass?: string;
      title: string;
      subtitle: string;
      promoKicker: string;
      promoLead: string;
      complements: typeof homeMainSliderBesosComplements;
      cta: string;
      thumbLabel: string;
      kind: "hero-img";
      image: typeof homeMainSliderBarImage;
      thumbSrc: string;
    }
  | {
      id: "imt300";
      href: string;
      slideClass?: string;
      title: string;
      titleEm: string;
      promoKicker: string;
      promoLead: string;
      promoBadges: readonly string[];
      promoPoints: readonly string[];
      cta: string;
      thumbLabel: string;
      kind: "hero-img";
      image: typeof homeMainSliderImt300Image;
      thumbSrc: string;
    };

export const homeMainSliderSlides: HomeMainSliderSlide[] = [
  {
    id: "pfos",
    href: "pfos.html",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--pfos",
    title: "Proje Fabrikası",
    subtitle: "Beş dakikada ekipman listesi ve anlık teklif",
    cta: "Keşfet →",
    thumbLabel: "Proje Fabrikası",
    kind: "pfos-img",
    image: homeMainSliderPfosImage,
  },
  {
    id: "besos",
    href: "bar-design.html",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--bar",
    title: "Bar Design Studio",
    subtitle: "IMT300 berrak buz · modüler kokteyl istasyonu",
    cta: "Keşfet →",
    thumbLabel: "Bar Design",
    kind: "hero-img",
    image: homeMainSliderBarImage,
    thumbSrc: homeMainSliderBarImage.path,
    promoKicker: "Tamamlayıcı ürünler · The Manhattan",
    promoLead:
      "En çok satan iki kişilik istasyon; entegre dondurucu çekmeceleri, genişletilmiş damlama tepsisi, evye ve bardak saklama.",
    complements: homeMainSliderBesosComplements,
  },
  {
    id: "sogutma",
    href: "/shop/sogutma",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--sogutma",
    title: "Soğutma & pişirme",
    subtitle: "Atalay pişirme · Öztiryakiler soğutma · canlı fiyat",
    cta: "Keşfet →",
    thumbLabel: "Soğutma",
    kind: "background",
    background: homeMainSliderSogutmaPisirmeImage.path,
    thumbSrc: homeMainSliderSogutmaPisirmeImage.path,
  },
  {
    id: "imt300",
    href: "/besos/imt300",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--imt300",
    title: "IMT300",
    titleEm: "Berrak Buz Makinesi",
    promoKicker: "Besos · Bar Design Studio · Skyra IMT300",
    promoLead:
      "Kesim gerektirmeden, standart formlarda parti halinde berrak buz üreten ticari ünite. Bar, otel ve restoranlar için yerinde üretim — dışarıdan buz tedarik maliyetini düşürür, kokteyl ve premium içecek sunumunu yükseltir.",
    promoBadges: ["2 tepsi", "5 buz formu", "Tek dokunuş", "Paslanmaz çelik"],
    promoPoints: [
      "Yavaş erime — kokteylde sulandırma azalır",
      "Kesim yok — küp, küre, çubuk ve elmas form",
      "Tek panelden dolum, dondurma ve depolama",
      "Yüksek hacimde dış buz lojistiği maliyetini düşürür",
    ],
    cta: "Ürün sayfasına git →",
    thumbLabel: "IMT300",
    kind: "hero-img",
    image: homeMainSliderImt300Image,
    thumbSrc: homeMainSliderImt300Image.path,
  },
];
