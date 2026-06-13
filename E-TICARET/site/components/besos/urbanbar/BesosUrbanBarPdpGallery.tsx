"use client";

import { useCallback, useState } from "react";
import { isShopifyCdn } from "@/lib/besos/urbanbar/plp-images";

type Props = {
  images: string[];
  name: string;
};

function imgExtra(url: string) {
  return isShopifyCdn(url) ? ({ referrerPolicy: "no-referrer" as const }) : {});
}

export default function BesosUrbanBarPdpGallery({ images, name }: Props) {
  const [urls, setUrls] = useState(() => images.filter(Boolean));
  const [active, setActive] = useState(0);
  const current = urls[active] || "";

  const dropBroken = useCallback((badSrc: string) => {
    setUrls((prev) => {
      const idx = prev.indexOf(badSrc);
      const next = prev.filter((u) => u !== badSrc);
      if (next.length === prev.length) return prev;
      setActive((i) => {
        if (idx < 0) return Math.min(i, next.length - 1);
        if (i > idx) return Math.min(i - 1, next.length - 1);
        return Math.min(i, Math.max(0, next.length - 1));
      });
      return next;
    });
  }, []);

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
        <div className="ub-pdp-gallery__stage">
          <div className="ub-pdp-gallery__main ub-pdp-gallery__main--ph">Urban Bar</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ub-pdp-gallery">
      <div className="ub-pdp-gallery__stage">
        {urls.length > 1 ? (
          <>
            <button
              type="button"
              className="ub-pdp-gallery__nav ub-pdp-gallery__nav--prev"
              onClick={prev}
              aria-label="Önceki görsel"
            >
              ‹
            </button>
            <button
              type="button"
              className="ub-pdp-gallery__nav ub-pdp-gallery__nav--next"
              onClick={next}
              aria-label="Sonraki görsel"
            >
              ›
            </button>
          </>
        ) : null}
        <div className="ub-pdp-gallery__main-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ub-pdp-gallery__main"
            src={current}
            alt={name}
            onError={() => dropBroken(current)}
            {...imgExtra(current)}
          />
        </div>
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
              <img src={src} alt="" loading="lazy" decoding="async" onError={() => dropBroken(src)} {...imgExtra(src)} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
