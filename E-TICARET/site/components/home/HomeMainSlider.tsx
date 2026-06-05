"use client";

/** Kilit: public/home-main-slider-KILIT.txt — npm run verify:home-main-slider-kilit */
import {
  homeMainSliderSlides,
  type HomeMainSliderSlide,
} from "@/lib/home-slider-content";
import { publicAssetUrl } from "@/lib/public-asset-url";

type SplitPromoSlide = Extract<HomeMainSliderSlide, { kind: "hero-img" }>;
type SketchSlide = Extract<HomeMainSliderSlide, { kind: "sketch" }>;

function isSketchSlide(slide: HomeMainSliderSlide): slide is SketchSlide {
  return slide.kind === "sketch";
}

function isSplitPromoSlide(slide: HomeMainSliderSlide): slide is SplitPromoSlide {
  return slide.kind === "hero-img";
}

function splitAlt(slide: SplitPromoSlide): string {
  if (slide.id === "imt300") return "IMT300 berrak buz makinesi";
  return "Electrolux Professional XP pişirme serisi — modüler pişirme hattı";
}

function PfosSketchSlideView({
  slide,
  activeClass,
}: {
  slide: SketchSlide;
  activeClass: string;
}) {
  return (
    <div key={slide.id} className={`${activeClass} eq-mx-hero__slide--sketch-only`}>
      <a className="eq-mx-hero__slide-media" href={slide.href}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="eq-mx-hero__slide-bg"
          src={publicAssetUrl(slide.image.path)}
          alt="Proje Fabrikası — bar ve mutfak plan eskizi"
          width={slide.image.width}
          height={slide.image.height}
          decoding="async"
        />
      </a>
    </div>
  );
}

function SplitPromoSlideView({
  slide,
  activeClass,
}: {
  slide: SplitPromoSlide;
  activeClass: string;
}) {
  const alt = splitAlt(slide);

  return (
    <div
      key={slide.id}
      className={`${activeClass} eq-mx-hero__slide--split`}
    >
      <a className="eq-mx-hero__slide-media" href={slide.href}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="eq-mx-hero__slide-bg"
          src={publicAssetUrl(slide.image.path)}
          alt={alt}
          width={slide.image.width}
          height={slide.image.height}
          decoding="async"
        />
      </a>
      <div className="eq-mx-hero__slide-promo">
        <p className="eq-mx-hero__slide-promo-kicker">{slide.promoKicker}</p>
        <h2>
          {slide.title}{" "}
          <em className="eq-mx-hero__slide-promo-em">{slide.titleEm}</em>
        </h2>
        <p className="eq-mx-hero__slide-promo-lead">{slide.promoLead}</p>
        <ul className="eq-mx-hero__slide-promo-badges">
          {slide.promoBadges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
        <ul className="eq-mx-hero__slide-promo-points">
          {slide.promoPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <a className="eq-mx-hero__slide-cta" href={slide.href}>
          {slide.cta}
        </a>
      </div>
    </div>
  );
}

export function HomeMainSlider() {
  return (
    <section
      className="eq-mx-vitrin eq-decor-slider-only"
      aria-label="Ana slider"
      data-eq-slider-kilit="1"
    >
      <div className="eq-mx-hero">
        <div className="eq-mx-hero__stage">
          <div className="eq-mx-hero__slides">
            {homeMainSliderSlides.map((slide, index) => {
              const baseClass = slide.slideClass ?? "eq-mx-hero__slide";
              const activeClass = index === 0 ? `${baseClass} is-active` : baseClass;

              if (isSketchSlide(slide)) {
                return (
                  <PfosSketchSlideView key={slide.id} slide={slide} activeClass={activeClass} />
                );
              }

              if (isSplitPromoSlide(slide)) {
                return (
                  <SplitPromoSlideView key={slide.id} slide={slide} activeClass={activeClass} />
                );
              }

              return null;
            })}
          </div>
          <button type="button" className="eq-mx-hero__nav eq-mx-hero__nav--prev" aria-label="Önceki">
            ‹
          </button>
          <button type="button" className="eq-mx-hero__nav eq-mx-hero__nav--next" aria-label="Sonraki">
            ›
          </button>
        </div>
        <div className="eq-mx-hero__thumbs">
          {homeMainSliderSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`eq-mx-hero__thumb eq-mx-hero__thumb--${slide.id}${index === 0 ? " is-active" : ""}`}
              aria-label={slide.thumbLabel}
            >
              {slide.kind === "hero-img" || slide.kind === "sketch" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publicAssetUrl(slide.thumbSrc)} alt="" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
