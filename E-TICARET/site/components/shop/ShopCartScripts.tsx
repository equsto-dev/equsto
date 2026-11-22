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
          bindCheckoutPage?: () => void;
          prefillCheckout?: () => void;
          syncFromServer?: (opts?: { force?: boolean }) => Promise<boolean>;
          startPolling?: () => void;
        };
      }
    ).EqustoCart;
    cart?.syncBadge?.();
    const cartPage = !!document.getElementById("equsto-cart-page");
    const checkoutPage = !!document.getElementById("equsto-checkout-page");
    if (cartPage) {
      cart?.bindPageActions?.();
      cart?.render?.();
      cart?.startPolling?.();
    }
    if (checkoutPage) {
      cart?.bindCheckoutPage?.();
      cart?.prefillCheckout?.();
      cart?.render?.();
    }
    if (cartPage || checkoutPage) {
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
