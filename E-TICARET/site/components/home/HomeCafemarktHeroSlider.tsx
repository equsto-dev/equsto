"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CafemarktPromoCard } from "@/lib/home-cafemarkt-content";
import { publicAssetUrl } from "@/lib/public-asset-url";

const AUTO_MS = 6000;

function isDirectProductHref(href: string): boolean {
  const path = href.split("?")[0].replace(/\/$/, "");
  return /^\/shop\/[^/]+\/.+/.test(path);
}

function goLink(
  e: React.MouseEvent,
  card: { href: string; legacyGo?: string; dept?: string },
) {
  e.preventDefault();
  const w = window as Window & {
    eqGo?: (key: string) => void;
    eqDeptGo?: (dept: string) => void;
  };
  if (card.legacyGo && typeof w.eqGo === "function") {
    w.eqGo(card.legacyGo);
    return;
  }
  if (isDirectProductHref(card.href)) {
    window.location.href = card.href;
    return;
  }
  if (card.dept && typeof w.eqDeptGo === "function") {
    w.eqDeptGo(card.dept);
    return;
  }
  window.location.href = card.href;
}

type SplitSlide = CafemarktPromoCard & {
  layout: "split";
  promoKicker: string;
  titleEm: string;
  promoLead: string;
  promoBadges: readonly string[];
  image: string;
};

function isSplitSlide(card: CafemarktPromoCard): card is SplitSlide {
  return card.layout === "split";
}

function SplitPromoSlide({ card }: { card: SplitSlide }) {
  return (
    <a
      className={`eq-cmkt-promo eq-cmkt-promo--split eq-cmkt-promo--main${card.textLight ? " eq-cmkt-promo--light" : ""}`}
      href={card.href}
      style={{ backgroundColor: card.bg }}
      onClick={(e) => goLink(e, card)}
    >
      <div className="eq-cmkt-promo__panel">
        <p className="eq-cmkt-promo__kicker">{card.promoKicker}</p>
        <h3 className="eq-cmkt-promo__title">
          {card.title}{" "}
          <em className="eq-cmkt-promo__em">{card.titleEm}</em>
        </h3>
        <p className="eq-cmkt-promo__lead">{card.promoLead}</p>
        <ul className="eq-cmkt-promo__badges">
          {card.promoBadges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      </div>
      <div className="eq-cmkt-promo__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="eq-cmkt-promo__media-img"
          src={publicAssetUrl(card.image)}
          alt={card.imageAlt ?? ""}
          loading="lazy"
          decoding="async"
        />
      </div>
    </a>
  );
}

export function HomeCafemarktHeroSlider({ slides }: { slides: CafemarktPromoCard[] }) {
  const splitSlides = slides.filter(isSplitSlide);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseUntilRef = useRef(0);
  const count = splitSlides.length;

  const goTo = useCallback((index: number) => {
    if (count <= 0) return;
    const clamped = ((index % count) + count) % count;
    setActive(clamped);
    pauseUntilRef.current = Date.now() + AUTO_MS;
  }, [count]);

  const go = useCallback(
    (dir: -1 | 1) => {
      goTo(active + dir);
    },
    [active, goTo],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setActive((prev) => (prev + 1) % count);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  if (count === 1) {
    return <SplitPromoSlide card={splitSlides[0]} />;
  }

  return (
    <div
      className="eq-cmkt-hero-main-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        pauseUntilRef.current = Date.now() + AUTO_MS;
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
          pauseUntilRef.current = Date.now() + AUTO_MS;
        }
      }}
    >
      <div className="eq-cmkt-hero-main-slider" aria-live="polite">
        {splitSlides.map((card, i) => (
          <div
            key={card.id}
            className={`eq-cmkt-hero-main-slide${i === active ? " is-active" : ""}`}
            aria-hidden={i !== active}
          >
            <SplitPromoSlide card={card} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="eq-cmkt-hero-main-nav eq-cmkt-hero-main-nav--prev"
        aria-label="Önceki slayt"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="eq-cmkt-hero-main-nav eq-cmkt-hero-main-nav--next"
        aria-label="Sonraki slayt"
        onClick={() => go(1)}
      >
        ›
      </button>
      <div className="eq-cmkt-hero-main-dots" role="tablist" aria-label="Öne çıkan ürün slaytları">
        {splitSlides.map((card, i) => (
          <button
            key={card.id}
            type="button"
            role="tab"
            className={`eq-cmkt-hero-main-dot${i === active ? " is-active" : ""}`}
            aria-label={`Slayt ${i + 1}: ${card.title} ${card.titleEm}`}
            aria-selected={i === active}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
