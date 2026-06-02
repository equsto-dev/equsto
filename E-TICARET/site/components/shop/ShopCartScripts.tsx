"use client";

import Script from "next/script";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

function refreshCartUi() {
  try {
    const cart = (
      window as Window & {
        EqustoCart?: {
          syncBadge?: () => void;
          render?: () => void;
          bindPageActions?: () => void;
        };
      }
    ).EqustoCart;
    cart?.syncBadge?.();
    if (document.getElementById("equsto-cart-page")) {
      cart?.bindPageActions?.();
      cart?.render?.();
    }
  } catch (_) {}
}

export default function ShopCartScripts() {
  return (
    <>
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script src="/ecom-data.js" strategy="afterInteractive" />
      <Script src={`/eq-shop-header.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-member.js?v=${v}`} strategy="beforeInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={refreshCartUi}
      />
    </>
  );
}
