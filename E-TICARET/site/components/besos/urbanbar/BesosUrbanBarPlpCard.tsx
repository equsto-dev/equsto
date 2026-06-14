"use client";

import Link from "next/link";
import { useMemo, useState, type MouseEvent, type SyntheticEvent } from "react";
import type { BesosLocale } from "@/lib/besos/locale";
import { isShopifyCdn, resolveUrbanBarPlpImages } from "@/lib/besos/urbanbar/plp-images";
import { splitUrbanBarPrice } from "@/lib/besos/urbanbar/price";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

type CartItem = {
  n: string;
  b: string;
  c: string;
  p: string;
  img?: string;
};

type Props = {
  product: BesosUrbanBarProduct;
  locale?: BesosLocale;
  cartReady?: boolean;
};

function imgProps(url: string) {
  return {
    referrerPolicy: isShopifyCdn(url) ? ("no-referrer" as const) : undefined,
    decoding: "async" as const,
  };
}

export default function BesosUrbanBarPlpCard({ product, locale = "tr", cartReady = false }: Props) {
  const [qty, setQty] = useState(1);
  const resolved = useMemo(() => resolveUrbanBarPlpImages(product), [product]);
  const [defaultOverride, setDefaultOverride] = useState<string | null>(null);
  const [hoverOverride, setHoverOverride] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState(0);
  const [hoverFailed, setHoverFailed] = useState(false);

  const defaultUrl = defaultOverride || resolved.defaultUrl;
  const hoverUrl = hoverFailed ? "" : hoverOverride || resolved.hoverUrl;
  const { hoverCandidates } = resolved;

  const pdpHref = product.besosHref || "#";
  const { amount, vat } = splitUrbanBarPrice(product.price || "", locale);
  const inStock = product.inStock !== false;

  const labels = {
    add: locale === "en" ? "Add to Cart" : "Sepete Ekle",
    minus: locale === "en" ? "Decrease" : "Azalt",
    plus: locale === "en" ? "Increase" : "Artır",
    wish: locale === "en" ? "Add to Wishlist" : "İstek listesine ekle",
  };

  const cartItem: CartItem = {
    n: product.name,
    b: product.vendor || "Urban Bar",
    c: product.groupLabelTr || product.sectionLabelTr || "",
    p: product.price || "",
    img: defaultUrl.startsWith("http") ? defaultUrl : defaultUrl || undefined,
  };

  function addToCart(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const cart = window.EqustoCart as
      | { addFromItem?: (item: CartItem, opts?: { silent?: boolean }) => void; syncBadge?: () => void }
      | undefined;
    if (!cart?.addFromItem) return;
    for (let i = 0; i < qty; i++) {
      cart.addFromItem(cartItem, { silent: i < qty - 1 });
    }
    cart.syncBadge?.();
  }

  function onHoverError(e: SyntheticEvent<HTMLImageElement>) {
    const next = hoverCandidates[hoverIdx + 1];
    if (!next) {
      setHoverFailed(true);
      return;
    }
    setHoverIdx((i) => i + 1);
    setHoverOverride(next);
    e.currentTarget.src = next;
  }

  function preloadHoverImage() {
    if (!hoverUrl || hoverFailed) return;
    const probe = new Image();
    if (isShopifyCdn(hoverUrl)) probe.referrerPolicy = "no-referrer";
    probe.src = hoverUrl;
  }

  function onDefaultError(e: SyntheticEvent<HTMLImageElement>) {
    const fallbacks = (product.imageUrls || []).filter((u) => u && u !== defaultUrl);
    const next = fallbacks[0] || product.imageUrl;
    if (!next || next === defaultUrl) return;
    setDefaultOverride(next);
    e.currentTarget.src = next;
  }

  return (
    <article
      className={`ub-plp-card${hoverUrl ? " ub-plp-card--has-hover" : ""}`}
      onMouseEnter={preloadHoverImage}
    >
      <Link
        className={`ub-plp-card__media${hoverUrl ? " ub-plp-card__media--has-hover" : ""}`}
        href={pdpHref}
      >
        {defaultUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={defaultUrl}
              alt={product.name}
              className="ub-plp-card__image ub-plp-card__image--default"
              loading="lazy"
              onError={onDefaultError}
              {...imgProps(defaultUrl)}
            />
            {hoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hoverUrl}
                alt=""
                aria-hidden="true"
                className="ub-plp-card__image ub-plp-card__image--hover"
                loading="eager"
                onError={onHoverError}
                {...imgProps(hoverUrl)}
              />
            ) : null}
          </>
        ) : (
          <span className="ub-plp-card__ph">Urban Bar</span>
        )}
      </Link>
      <div className="ub-plp-card__body">
        <h3 className="ub-plp-card__title">
          <Link href={pdpHref}>{product.name}</Link>
        </h3>
        {amount ? (
          <div className="ub-plp-card__price">
            <span className="ub-plp-card__price-amount">{amount}</span>
            {vat ? <span className="ub-plp-card__price-vat">{vat}</span> : null}
          </div>
        ) : null}
        <div className="ub-plp-card__buy">
          <div className="ub-plp-card__qty" role="group" aria-label={locale === "en" ? "Quantity" : "Adet"}>
            <button
              type="button"
              className="ub-plp-card__qty-btn"
              aria-label={labels.minus}
              onClick={(e) => {
                e.preventDefault();
                setQty((q) => Math.max(1, q - 1));
              }}
            >
              −
            </button>
            <span className="ub-plp-card__qty-val">{qty}</span>
            <button
              type="button"
              className="ub-plp-card__qty-btn"
              aria-label={labels.plus}
              onClick={(e) => {
                e.preventDefault();
                setQty((q) => Math.min(99, q + 1));
              }}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="ub-plp-card__cart-btn"
            disabled={!cartReady || !inStock}
            onClick={addToCart}
          >
            {labels.add}
          </button>
          <button
            type="button"
            className="ub-plp-card__wish"
            disabled
            title={locale === "en" ? "Coming soon" : "Yakında"}
            aria-label={labels.wish}
          >
            ♡
          </button>
        </div>
      </div>
    </article>
  );
}
