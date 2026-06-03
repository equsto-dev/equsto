"use client";

/** Kilit: public/home-main-slider-KILIT.txt — npm run verify:home-main-slider-kilit */
import { homeMainSliderSlides } from "@/lib/home-slider-content";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

function assetUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${SHOP_ASSET_V}`;
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

              if (slide.kind === "pfos-img") {
                return (
                  <a key={slide.id} className={activeClass} href={slide.href}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="eq-mx-hero__slide-bg"
                      src={assetUrl(slide.image.path)}
                      alt="Proje Fabrikası — bar ve mutfak plan eskizi"
                      width={slide.image.width}
                      height={slide.image.height}
                      decoding="async"
                    />
                    <div className="eq-mx-hero__slide-shade" aria-hidden="true" />
                    <div className="eq-mx-hero__slide-cap">
                      <h2>{slide.title}</h2>
                      <p>{slide.subtitle}</p>
                      <span className="eq-mx-hero__slide-cta">{slide.cta}</span>
                    </div>
                  </a>
                );
              }

              const bg =
                slide.background.startsWith("linear-gradient") ||
                slide.background.startsWith("url(")
                  ? slide.background
                  : `url(${assetUrl(slide.background)})`;

              return (
                <a
                  key={slide.id}
                  className={activeClass}
                  href={slide.href}
                  style={{ backgroundImage: bg }}
                >
                  {slide.id === "besos" || slide.id === "sogutma" ? (
                    <div className="eq-mx-hero__slide-shade" aria-hidden="true" />
                  ) : null}
                  <div className="eq-mx-hero__slide-cap">
                    <h2>{slide.title}</h2>
                    <p>{slide.subtitle}</p>
                    <span className="eq-mx-hero__slide-cta">{slide.cta}</span>
                  </div>
                </a>
              );
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
              className={`eq-mx-hero__thumb${index === 0 ? " is-active" : ""}`}
              aria-label={slide.thumbLabel}
            >
              {slide.kind === "pfos-img" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(slide.image.path)} alt="" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(slide.thumbSrc)} alt="" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
