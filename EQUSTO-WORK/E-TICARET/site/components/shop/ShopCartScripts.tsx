"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export default function ShopCartScripts() {
  return (
    <>
      <Script src="/ecom-data.js" strategy="afterInteractive" />
      <Script src={`/eq-shop-header.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => {
          try {
            const cart = (window as Window & { EqustoCart?: { syncBadge?: () => void; render?: () => void } })
              .EqustoCart;
            cart?.syncBadge?.();
            if (document.getElementById("equsto-cart-page")) cart?.render?.();
          } catch (_) {}
        }}
      />
    </>
  );
}
