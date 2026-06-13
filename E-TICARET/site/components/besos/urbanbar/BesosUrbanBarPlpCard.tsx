"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Script from "next/script";
import { besosAssetPath } from "@/lib/besos/asset-path";
import type { BesosLocale } from "@/lib/besos/locale";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";
import { splitUrbanBarPrice } from "@/lib/besos/urbanbar/price";

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

export default function BesosUrbanBarPlpCard({ product, locale = "tr", cartReady = false }: Props) {
  const [qty, setQty] = useState(1);
  const img = product.imageUrl || (product.image ? besosAssetPath(product.image) : "");
  const pdpHref = product.besosHref || product.shopHref || "#";
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
    img: img.startsWith("http") ? img : img || undefined,
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

  return (
    <article className="ub-plp-card">
      <Link className="ub-plp-card__media" href={pdpHref}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} loading="lazy" decoding="async" />
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
