"use client";

import Image from "next/image";
import { useEffect } from "react";
import Link from "next/link";

const ICE_STRIP_IMAGES = [
  { src: "/assets/besos-ice-mint-DUtHKFgd.png", alt: "Berrak buz küpü" },
  { src: "/assets/besos-ice-bar-uGGlF5Nj.png", alt: "Buz çubuğu" },
  { src: "/assets/besos-ice-tong-DsigH4FN.png", alt: "Buz küpü servisi" },
  { src: "/assets/besos-ice-diamond-DMNdO_4O.png", alt: "Buz elması" },
  { src: "/assets/besos-ice-molds-6zkZE2su.png", alt: "Silikon kalıplar" },
  { src: "/assets/besos-ice-sphere-NLq_ILu6.png", alt: "Buz küresi" },
] as const;

export default function BesosImt300Hero() {
  useEffect(() => {
    const init = () => {
      const w = window as unknown as { __eqYoutubeEmbedInit?: () => void };
      w.__eqYoutubeEmbedInit?.();
    };
    const t = window.setTimeout(init, 500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <section className="bd-hero bd-hero-fullbleed" id="bd-hero" aria-label="Besos tanıtım videosu">
        <div className="bd-hero-media">
          <div className="bd-hero-video">
            <div
              className="eq-yt"
              id="bd-hero-yt"
              data-eq-yt-id="cOVgfu2o4h4"
              data-eq-yt-title="Besos · Equsto Bar Studio"
              data-eq-yt-autoplay="1"
              data-eq-yt-mute="1"
              data-eq-yt-loop="1"
              data-eq-yt-controls="0"
              data-eq-yt-watch="0"
            />
          </div>
          <div className="bd-hero-overlay" aria-hidden="true" />
        </div>
        <aside className="bd-hero-action" aria-label="Videodaki ürün IMT300">
          <div className="bd-hero-action-inner">
            <p className="bd-hero-action-label">Skyra IMT300 · Berrak buz makinesi</p>
            <Link className="bd-hero-cta-btn" href="/besos/imt300">
              Sayfaya Git
            </Link>
            <p className="bd-hero-cta-price">
              Liste fiyatı: <strong>11.500 €</strong> · teklif için iletişim
            </p>
          </div>
        </aside>
      </section>

      <section className="bd-ice-strip" aria-label="Buz ve servis görselleri">
        <div className="bd-ice-strip-inner">
          {ICE_STRIP_IMAGES.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={640}
              height={800}
              loading="lazy"
              unoptimized
            />
          ))}
        </div>
      </section>
    </>
  );
}
