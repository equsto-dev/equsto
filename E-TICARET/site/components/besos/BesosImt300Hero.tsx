"use client";

import Image from "next/image";
import Link from "next/link";
import { besosHeroYoutubeEmbedUrl, BESOS_HERO_YT_ID } from "@/lib/besos/youtube-embed";

const ICE_STRIP_IMAGES = [
  { src: "/assets/besos-ice-mint-DUtHKFgd.png", alt: "Berrak buz küpü" },
  { src: "/assets/besos-ice-bar-uGGlF5Nj.png", alt: "Buz çubuğu" },
  { src: "/assets/besos-ice-tong-DsigH4FN.png", alt: "Buz küpü servisi" },
  { src: "/assets/besos-ice-diamond-DMNdO_4O.png", alt: "Buz elması" },
  { src: "/assets/besos-ice-molds-6zkZE2su.png", alt: "Silikon kalıplar" },
  { src: "/assets/besos-ice-sphere-NLq_ILu6.png", alt: "Buz küresi" },
] as const;

const HERO_EMBED_SRC = besosHeroYoutubeEmbedUrl(BESOS_HERO_YT_ID);

export default function BesosImt300Hero() {
  return (
    <>
      <section className="bd-hero bd-hero-fullbleed" id="bd-hero" aria-label="Besos tanıtım videosu" data-i18n-attr="aria-label:besos.hero_iframe_title">
        <div className="bd-hero-media">
          <div className="bd-hero-video">
            <iframe
              className="bd-hero-yt-iframe"
              src={HERO_EMBED_SRC}
              title="Besos · Equsto Bar Studio"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="eager"
            />
          </div>
          <div className="bd-hero-overlay" aria-hidden="true" />
        </div>
        <aside className="bd-hero-action" aria-label="Videodaki ürün IMT300" data-i18n-attr="aria-label:besos.hero_product_label">
          <div className="bd-hero-action-inner">
            <p className="bd-hero-action-label" data-i18n="besos.hero_product_label">
              Skyra IMT300 · Berrak buz makinesi
            </p>
            <Link className="bd-hero-cta-btn" href="/besos/imt300" data-i18n="besos.hero_go_page">
              Sayfaya Git
            </Link>
            <p className="bd-hero-cta-price" data-i18n="besos.hero_price_hint">
              Liste fiyatı: <strong>11.500 €</strong> · teklif için iletişim
            </p>
          </div>
        </aside>
      </section>

      <section className="bd-ice-strip" aria-label="Buz ve servis görselleri" data-i18n-attr="aria-label:besos.ice_strip_aria">
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
