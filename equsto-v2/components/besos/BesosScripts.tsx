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
  }
}

export default function BesosScripts() {
  useEffect(() => {
    document.body.classList.add("bd-page", "besos", "besos-locked", "eq-shop");
    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t = window.setTimeout(mountFooter, 400);
    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("bd-page", "besos", "besos-locked", "eq-shop");
    };
  }, []);

  return (
    <>
      <Script src="/theme.js" strategy="beforeInteractive" />
      <Script src="/equsto-logo.js" strategy="afterInteractive" />
      <Script src="/nav.js" strategy="afterInteractive" />
      <Script src="/eq-youtube-embed.js" strategy="afterInteractive" />
      <Script src="/eq-bar-module-url.js" strategy="afterInteractive" />
      <Script src="/eq-besos-pricing.js" strategy="afterInteractive" />
      <Script src="/eq-kur-live.js" strategy="afterInteractive" />
      <Script src="/ecom-cart.js" strategy="afterInteractive" />
      <Script src="/eq-besos-actions.js" strategy="afterInteractive" />
      <Script src="/eq-footer.js" strategy="afterInteractive" />
      <Script src="/contact.js" strategy="lazyOnload" />
    </>
  );
}
