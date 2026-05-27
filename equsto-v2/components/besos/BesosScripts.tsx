"use client";

import { useEffect } from "react";
import Script from "next/script";

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
  }
}

function refreshNavDrawer() {
  window.dispatchEvent(new Event("load"));
}

export default function BesosScripts() {
  useEffect(() => {
    document.body.classList.add("bd-page", "besos", "eq-shop");
    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t1 = window.setTimeout(mountFooter, 400);
    const t2 = window.setTimeout(refreshNavDrawer, 200);
    const t3 = window.setTimeout(refreshNavDrawer, 800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      document.body.classList.remove("bd-page", "besos", "eq-shop");
    };
  }, []);

  return (
    <>
      <Script src="/theme.js" strategy="beforeInteractive" />
      <Script src="/eq-site-urls.js" strategy="beforeInteractive" />
      <Script src="/equsto-logo.js" strategy="afterInteractive" />
      <Script src="/nav.js" strategy="afterInteractive" onReady={refreshNavDrawer} />
      <Script src="/eq-youtube-embed.js" strategy="afterInteractive" />
      <Script src="/eq-bar-module-url.js" strategy="afterInteractive" />
      <Script src="/eq-besos-pricing.js" strategy="afterInteractive" />
      <Script src="/eq-kur-live.js" strategy="afterInteractive" />
      <Script src="/ecom-cart.js?v=20260524cart3" strategy="afterInteractive" onReady={() => window.EqustoCart?.syncBadge?.()} />
      <Script src="/eq-besos-actions.js" strategy="afterInteractive" />
      <Script src="/eq-footer.js" strategy="afterInteractive" />
      <Script src="/contact.js" strategy="lazyOnload" />
    </>
  );
}
