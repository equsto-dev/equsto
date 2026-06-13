"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

type CartItem = {
  n: string;
  b: string;
  c: string;
  p: string;
  img?: string;
};

type Props = {
  item: CartItem;
  locale?: "tr" | "en";
  inStock?: boolean;
};

export default function BesosUrbanBarPdpCart({ item, locale = "tr", inStock = true }: Props) {
  const [qty, setQty] = useState(1);
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    if (window.EqustoCart) setCartReady(true);
  }, []);

  const labels = {
    add: locale === "en" ? "Add to Cart" : "Sepete Ekle",
    qty: locale === "en" ? "Quantity" : "Adet",
    minus: locale === "en" ? "Decrease" : "Azalt",
    plus: locale === "en" ? "Increase" : "Artır",
    trust:
      locale === "en"
        ? "Professional barware — Urban Bar collection on Equsto."
        : "Profesyonel bar ekipmanı — Equsto'da Urban Bar koleksiyonu.",
  };

  function addToCart() {
    const cart = window.EqustoCart as
      | {
          addFromItem?: (item: CartItem, opts?: { silent?: boolean }) => void;
          syncBadge?: () => void;
        }
      | undefined;
    if (!cart?.addFromItem) return;
    for (let i = 0; i < qty; i++) {
      cart.addFromItem(item, { silent: i < qty - 1 });
    }
    cart.syncBadge?.();
  }

  return (
    <>
      <Script
        src={`/ecom-cart.js?v=${SHOP_ASSET_V}`}
        strategy="afterInteractive"
        onReady={() => {
          setCartReady(true);
          window.EqustoCart?.syncBadge?.();
        }}
      />
      <div className="ub-pdp-buy">
        <div className="ub-pdp-buy__row">
          <div className="ub-pdp-qty" role="group" aria-label={labels.qty}>
            <button
              type="button"
              className="ub-pdp-qty__btn"
              aria-label={labels.minus}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="ub-pdp-qty__val">{qty}</span>
            <button
              type="button"
              className="ub-pdp-qty__btn"
              aria-label={labels.plus}
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="ub-pdp-cart-btn"
            disabled={!cartReady || !inStock}
            onClick={addToCart}
          >
            {labels.add}
          </button>
        </div>
        <aside className="ub-pdp-trust" aria-label="Urban Bar">
          <span className="ub-pdp-trust__brand">Urban Bar</span>
          <p className="ub-pdp-trust__text">{labels.trust}</p>
        </aside>
      </div>
    </>
  );
}
