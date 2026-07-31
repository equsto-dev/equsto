"use client";

import { useEffect } from "react";
import Script from "next/script";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { ECOM_ASSET_V, SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;
const cartV = ECOM_ASSET_V;

function refreshCartUi() {
  try {
    const cart = (
      window as Window & {
        EqustoCart?: {
          syncBadge?: () => void;
          render?: () => void;
          bindPageActions?: () => void;
          prefillCheckout?: () => void;
          syncFromServer?: (opts?: { force?: boolean }) => Promise<boolean>;
          startPolling?: () => void;
        };
      }
    ).EqustoCart;
    cart?.syncBadge?.();
    if (document.getElementById("equsto-cart-page")) {
      cart?.bindPageActions?.();
      cart?.prefillCheckout?.();
      cart?.render?.();
      cart?.startPolling?.();
      // Auto-pull from server on page mount to sync cart (like Amazon)
      cart?.syncFromServer?.({ force: true }).then(() => {
        cart?.render?.();
        cart?.prefillCheckout?.();
        cart?.syncBadge?.();
      });
    }
  } catch (_) {}
}

export default function ShopCartScripts() {
  useEffect(() => {
    refreshCartUi();
  }, []);

  return (
    <>
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script src="/ecom-data.js" strategy="afterInteractive" />
      <Script src={`/eq-shop-header.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-member.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-price-display.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${cartV}`}
        strategy="afterInteractive"
        onReady={refreshCartUi}
      />
    </>
  );
}
