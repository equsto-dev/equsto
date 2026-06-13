"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { splitUrbanBarPrice } from "@/lib/besos/urbanbar/price";

export type RelatedProduct = {
  name: string;
  price: string;
  image?: string;
  href: string;
};

type Props = {
  items: RelatedProduct[];
  locale?: "tr" | "en";
};

export default function BesosUrbanBarPdpRelated({ items, locale = "tr" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const title = locale === "en" ? "You may also like:" : "Bunları da beğenebilirsiniz:";

  const scroll = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.85), behavior: "smooth" });
  }, []);

  if (!items.length) return null;

  return (
    <section className="ub-pdp-related" aria-label={title}>
      <h2 className="ub-pdp-related__title">{title}</h2>
      <div className="ub-pdp-related__wrap">
        <button type="button" className="ub-pdp-related__nav ub-pdp-related__nav--prev" onClick={() => scroll(-1)} aria-label={locale === "en" ? "Previous" : "Önceki"}>
          ‹
        </button>
        <div className="ub-pdp-related__track" ref={trackRef}>
          {items.map((p) => {
            const { amount, vat } = splitUrbanBarPrice(p.price, locale);
            return (
            <Link key={p.href} href={p.href} className="ub-pdp-related__card">
              <span className="ub-pdp-related__img">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} loading="lazy" decoding="async" />
                ) : (
                  <span className="ub-pdp-related__ph">Urban Bar</span>
                )}
              </span>
              <span className="ub-pdp-related__body">
                <span className="ub-pdp-related__name">{p.name}</span>
                {amount ? (
                  <span className="ub-pdp-related__price">
                    {amount}
                    {vat ? <span className="ub-pdp-related__vat"> {vat}</span> : null}
                  </span>
                ) : null}
              </span>
              <span className="ub-pdp-related__wish" aria-hidden="true">
                ♡
              </span>
            </Link>
          );})}
        </div>
        <button type="button" className="ub-pdp-related__nav ub-pdp-related__nav--next" onClick={() => scroll(1)} aria-label={locale === "en" ? "Next" : "Sonraki"}>
          ›
        </button>
      </div>
    </section>
  );
}
