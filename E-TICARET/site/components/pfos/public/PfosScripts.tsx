"use client";

import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import { useEffect } from "react";
import Script from "next/script";

const v = SHOP_ASSET_V;

declare global {
  interface Window {
    __eqMountMarketFooter?: () => void;
    eqGo?: (key: string) => void;
    toggleDrawer?: () => void;
    EqustoCart?: { goToCartPage?: () => void; syncBadge?: () => void };
    EQUSTO_LOGO_REFRESH?: () => void;
  }
}

function refreshNavDrawer() {
  window.dispatchEvent(new Event("load"));
}

/** Vitrin scriptleri + kategori çekmecesi — /pfos Next sihirbazı */
export default function PfosScripts() {
  useEffect(() => {
    document.body.classList.add("eq-shop", "eq-pfos-public");
    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t1 = window.setTimeout(mountFooter, 400);
    const t2 = window.setTimeout(refreshNavDrawer, 200);
    const t3 = window.setTimeout(refreshNavDrawer, 800);
    const t4 = window.setTimeout(() => window.EQUSTO_LOGO_REFRESH?.(), 100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      document.body.classList.remove("eq-shop", "eq-pfos-public");
    };
  }, []);

  return (
    <>
      <Script src={`/theme.js?v=${v}`} strategy="beforeInteractive" />
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script
        src={`/equsto-logo.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => window.EQUSTO_LOGO_REFRESH?.()}
      />
      <Script src={`/nav.js?v=${v}`} strategy="afterInteractive" onReady={refreshNavDrawer} />
      <Script src={`/eq-header-search.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => window.EqustoCart?.syncBadge?.()}
      />
      <Script src={`/eq-footer.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/contact.js?v=${v}`} strategy="lazyOnload" />
    </>
  );
}
