"use client";

import { useCallback, useState } from "react";

type Props = {
  images: string[];
  name: string;
};

export default function BesosUrbanBarPdpGallery({ images, name }: Props) {
  const urls = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const current = urls[active] || "";

  const prev = useCallback(() => {
    if (urls.length < 2) return;
    setActive((i) => (i - 1 + urls.length) % urls.length);
  }, [urls.length]);

  const next = useCallback(() => {
    if (urls.length < 2) return;
    setActive((i) => (i + 1) % urls.length);
  }, [urls.length]);

  if (!current) {
    return (
      <div className="ub-pdp-gallery">
        <div className="ub-pdp-gallery__main ub-pdp-gallery__main--ph">Urban Bar</div>
      </div>
    );
  }

  return (
    <div className="ub-pdp-gallery">
      <div className="ub-pdp-gallery__main-wrap">
        {urls.length > 1 ? (
          <>
            <button type="button" className="ub-pdp-gallery__nav ub-pdp-gallery__nav--prev" onClick={prev} aria-label="Önceki görsel">
              ‹
            </button>
            <button type="button" className="ub-pdp-gallery__nav ub-pdp-gallery__nav--next" onClick={next} aria-label="Sonraki görsel">
              ›
            </button>
          </>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ub-pdp-gallery__main" src={current} alt={name} />
      </div>
      {urls.length > 1 ? (
        <div className="ub-pdp-gallery__thumbs" role="tablist" aria-label="Ürün görselleri">
          {urls.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`ub-pdp-gallery__thumb${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
