/** Ana sayfa alt slider — PFOS · Bar · Soğutma · IMT300 (kilit: public/home-main-slider-KILIT.txt) */

export const homeMainSliderPfosImage = {
  path: "/images/pfos/proje-fabrikasi-bar-plan-eskiz.png",
  width: 1024,
  height: 331,
} as const;

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
      id: "besos" | "sogutma";
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
      id: "imt300";
      href: string;
      slideClass?: string;
      title: string;
      subtitle: string;
      cta: string;
      thumbLabel: string;
      kind: "hero-img";
      image: typeof homeMainSliderImt300Image;
      thumbSrc: string;
    };

export const homeMainSliderSogutmaPisirmeImage = {
  path: "/images/home/hero-sogutma-pisirme-combo.jpg",
  width: 2048,
  height: 1044,
} as const;

export const homeMainSliderImt300Image = {
  path: "/images/imt300/imt300-1.jpg",
  width: 800,
  height: 600,
} as const;

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
    kind: "background",
    background: "/images/home/hero-bar-cocktailstation.png",
    thumbSrc: "/images/home/hero-bar-cocktailstation.png",
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
    subtitle: "Berrak buz makinesi · küp, küre, çubuk · yerinde üretim",
    cta: "Keşfet →",
    thumbLabel: "IMT300",
    kind: "hero-img",
    image: homeMainSliderImt300Image,
    thumbSrc: homeMainSliderImt300Image.path,
  },
];
