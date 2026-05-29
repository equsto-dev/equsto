"use client";

import Script from "next/script";
import { useEffect } from "react";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import { mountEqShopChromeLayout } from "@/lib/shop/sync-shop-chrome";

const v = SHOP_ASSET_V;

declare global {
  interface Window {
    EqBesosActions?: {
      addToCart: (p: unknown) => void;
      openContact: (p: unknown) => void;
    };
    filterStations?: (q: string) => void;
    __eqMountMarketFooter?: () => void;
    eqGo?: (key: string) => void;
    toggleDrawer?: () => void;
    EqustoCart?: { goToCartPage?: () => void; syncBadge?: () => void };
    __eqYoutubeEmbedInit?: () => void;
    __eqYoutubeActivate?: (root?: ParentNode) => void;
  }
}

export default function BesosScripts() {
  useEffect(() => {
    document.body.classList.add("bd-page", "besos", "eq-shop");

    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t1 = window.setTimeout(mountFooter, 400);
    const unmountChrome = mountEqShopChromeLayout();
    return () => {
      window.clearTimeout(t1);
      unmountChrome();
      document.body.classList.remove("bd-page", "besos", "eq-shop");
    };
  }, []);

  return (
    <>
      <Script src={`/theme.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-i18n.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-logo.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/nav.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-bar-module-url.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-besos-pricing.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => window.EqustoCart?.syncBadge?.()}
      />
      <Script src={`/eq-besos-actions.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-footer.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/contact.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => {
          try {
            window.equstoSyncContactFab?.();
            window.eqSyncMobileChrome?.();
          } catch (_) {}
        }}
      />
    </>
  );
}
