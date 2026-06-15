/** Ana sayfa alt slider — PFOS · IMT300 · Bar · Electrolux XP (kilit: public/home-main-slider-KILIT.txt) */

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

export const homeMainSliderSogutmaAtalayImage = {
  path: "/images/catalog/atalay/cafemarkt/atalay-e-agi---660.jpg",
  width: 800,
  height: 600,
} as const;

export const homeMainSliderSogutmaOztiImage = {
  path: "/images/catalog/ozti/web/ozti-7919-06nmv-00.jpg",
  width: 800,
  height: 600,
} as const;

export const homeMainSliderBarImage = {
  path: "/images/home/hero-bar-cocktailstation-cutout.png",
  width: 1200,
  height: 713,
} as const;

export const homeMainSliderImt300Image = {
  path: "/images/imt300/imt300-2.png",
  width: 3381,
  height: 3007,
} as const;

export const homeMainSliderElectroluxXpImage = {
  path: "/images/home/electrolux-xp-pisirme.webp",
  width: 600,
  height: 360,
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
    image: "/images/catalog/besos/web/besos-pl-bm-f-3-1-18.avif",
  },
] as const;

export type HomeMainSliderSlide =
  | {
      id: "pfos";
      href: string;
      slideClass?: string;
      thumbLabel: string;
      kind: "sketch";
      image: typeof homeMainSliderPfosImage;
      thumbSrc: string;
      /** Sol alt köşe — proje/liste CTA */
      sketchCaption?: string;
    }
  | {
      id: "electrolux-xp";
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
      image: typeof homeMainSliderElectroluxXpImage;
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
    href: "/pfos",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--pfos",
    thumbLabel: "Proje Fabrikası",
    kind: "sketch",
    image: homeMainSliderPfosImage,
    thumbSrc: homeMainSliderPfosImage.path,
    sketchCaption: "Projeni/ listeni gönder, fiyatlandıralım",
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
  {
    id: "electrolux-xp",
    href: "/shop/pisirme?marka=Electrolux",
    slideClass: "eq-mx-hero__slide eq-mx-hero__slide--electrolux-xp",
    title: "XP Pişirme Serisi",
    titleEm: "700XP · 900XP",
    promoKicker: "Electrolux Professional · modüler pişirme hattı",
    promoLead:
      "XP pişirme serisi hem fast-food hem de alakart restoranlara yönelik bir çözümdür. Modüler tasarımı, verimliliği, güvenilirliği, güvenlik özellikleri, kolay bakımı, sürdürülebilirlik ile ilgili avantajları, özel destek ve servisi ile XP serisi bir mutfakta ihtiyacınız olan her şeyi sunuyor.",
    promoBadges: ["Fast-food", "À la carte", "Modüler", "200+ model", "Gaz · Elektrik"],
    promoPoints: [
      "Gazlı ve elektrikli olmak üzere 200'den fazla modeli olan 700XP ve 900XP serileri, sırasıyla 700 mm ve 900 mm derinlikleriyle, her ölçekte mutfağa en iyi esnekliği ve uyarlanabilirliği getiriyor.",
    ],
    cta: "Keşfet →",
    thumbLabel: "Electrolux XP",
    kind: "hero-img",
    image: homeMainSliderElectroluxXpImage,
    thumbSrc: homeMainSliderElectroluxXpImage.path,
  },
];
