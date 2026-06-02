"use client";

import { heroPillars } from "@/lib/home-content";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

function assetUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${SHOP_ASSET_V}`;
}

function goLegacy(href: string | null, legacyKey?: string) {
  if (typeof window === "undefined") return;
  const w = window as Window & { eqGo?: (key: string) => void };
  if (legacyKey && typeof w.eqGo === "function") {
    w.eqGo(legacyKey);
    return;
  }
  if (href) window.location.href = href;
}

function imgClass(visual: (typeof heroPillars)[number]["visual"]): string {
  if (visual === "pfos") return "hero-card-img hero-card-img--pfos-cover";
  if (visual === "besos") return "hero-card-img hero-card-img--bar-combo";
  return "hero-card-img hero-card-img--yer-bufe";
}

export function HomeHeroAds() {
  return (
    <section
      className="hero eq-home-hero-ads"
      aria-label="Equsto vitrin reklamları"
      data-i18n-attr="aria-label:home.hero_ads_aria"
    >
      {heroPillars.map((pillar) => {
        const cardClass = `hero-card hero-card--${pillar.visual}${pillar.soon ? " hero-card--soon" : ""}`;
        const legacyKey =
          pillar.id === "pfos" ? "pfos" : pillar.id === "besos" ? "besos" : undefined;

        const body = (
          <>
            <div className={`hero-card-visual hero-card-visual--${pillar.visual}`} aria-hidden="true">
              {pillar.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={imgClass(pillar.visual)}
                  src={assetUrl(pillar.image)}
                  alt={
                    pillar.visual === "pfos"
                      ? "Proje Fabrikası — endüstriyel mutfak eskizi"
                      : pillar.visual === "besos"
                        ? "Besos modüler kokteyl istasyonu"
                        : "Yer Sofrası — açık büfe ve chafing ekipmanları"
                  }
                  width={pillar.imageWidth}
                  height={pillar.imageHeight}
                  loading={pillar.visual === "pfos" || pillar.visual === "besos" ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={pillar.visual === "pfos" ? "high" : undefined}
                />
              ) : null}
              {pillar.visual === "pfos" ? (
                <div className="hero-card-visual__shade hero-card-visual__shade--pfos" aria-hidden="true" />
              ) : null}
            </div>
            <div className="hero-card-body">
              <div className="hero-tag" data-i18n={`home.hero_card${pillar.id === "pfos" ? "1" : pillar.id === "yer" ? "2" : "3"}_tag`}>
                {pillar.tag}
              </div>
              <div className="hero-title">
                <span data-i18n={`home.hero_card${pillar.id === "pfos" ? "1" : pillar.id === "yer" ? "2" : "3"}_title`}>
                  {pillar.title}
                </span>
                {pillar.tagline ? (
                  <>
                    <span className="hero-title-sep" aria-hidden="true">
                      {" "}
                      |{" "}
                    </span>
                    {pillar.id === "pfos" || pillar.id === "besos" ? (
                      <em
                        className="hero-title-tagline"
                        data-i18n={`home.hero_card${pillar.id === "pfos" ? "1" : "3"}_tagline`}
                      >
                        {pillar.tagline}
                      </em>
                    ) : (
                      <span className="hero-title-tagline" data-i18n="home.hero_card2_tagline">
                        {pillar.tagline}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
              <p
                className="hero-pitch"
                data-i18n={`home.hero_card${pillar.id === "pfos" ? "1" : pillar.id === "yer" ? "2" : "3"}_pitch`}
              >
                {pillar.pitch}
              </p>
            </div>
          </>
        );

        if (pillar.soon || !pillar.href) {
          return (
            <div key={pillar.id} className={cardClass} aria-disabled="true">
              {body}
            </div>
          );
        }

        return (
          <div
            key={pillar.id}
            className={cardClass}
            role="link"
            tabIndex={0}
            onClick={() => goLegacy(pillar.href, legacyKey)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goLegacy(pillar.href, legacyKey);
            }}
          >
            {body}
          </div>
        );
      })}
    </section>
  );
}
