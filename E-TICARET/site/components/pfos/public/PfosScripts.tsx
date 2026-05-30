"use client";

import BesosDrawerShell from "@/components/besos/BesosDrawerShell";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { useEffect } from "react";
import Script from "next/script";

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
      <Script src="/theme.js" strategy="beforeInteractive" />
      <AssetCdnConfigScript />
      <Script src="/eq-site-urls.js" strategy="beforeInteractive" />
      <Script src="/equsto-logo.js" strategy="afterInteractive" onReady={() => window.EQUSTO_LOGO_REFRESH?.()} />
      <Script src="/nav.js" strategy="afterInteractive" onReady={refreshNavDrawer} />
      <Script src="/eq-header-search.js" strategy="afterInteractive" />
      <Script src="/ecom-cart.js" strategy="afterInteractive" onReady={() => window.EqustoCart?.syncBadge?.()} />
      <Script src="/eq-footer.js" strategy="afterInteractive" />
      <Script src="/contact.js" strategy="lazyOnload" />
      <BesosDrawerShell />
    </>
  );
}
