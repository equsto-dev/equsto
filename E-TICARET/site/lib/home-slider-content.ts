/** Ana sayfa alt slider — PFOS · Bar · Soğutma (kilit: public/home-main-slider-KILIT.txt) */

export const homeMainSliderPfosImage = {
  path: "/images/pfos/proje-fabrikasi-bar-plan-eskiz.png",
  width: 1024,
  height: 524,
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
    kind: "background",
    background: "/images/home/hero-bar-cocktailstation.png",
    thumbSrc: "/images/home/hero-bar-cocktailstation.png",
  },
  {
    id: "sogutma",
    href: "/shop/sogutma",
    title: "Soğutma & pişirme",
    subtitle: "Departman katalogları · profesyonel fiyatlandırma",
    cta: "Keşfet →",
    thumbLabel: "Soğutma",
    kind: "background",
    background: "linear-gradient(135deg,#001e50,#2a5a9e)",
    thumbSrc: "/images/catalog/ozti/p200/ozti-9805-im240x-nhc.jpg",
  },
];
