"use client";

import Script from "next/script";
import { useEffect } from "react";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

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

    const syncHdrSticky = () => {
      const hdr = document.querySelector<HTMLElement>("header.hdr");
      if (!hdr) return;
      const h = Math.round(hdr.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty("--eq-hdr-sticky-h", `${h}px`);
      }
    };

    syncHdrSticky();
    const hdr = document.querySelector<HTMLElement>("header.hdr");
    let ro: ResizeObserver | null = null;
    if (hdr && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(syncHdrSticky);
      ro.observe(hdr);
    }
    window.addEventListener("resize", syncHdrSticky);

    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t1 = window.setTimeout(mountFooter, 400);
    const t2 = window.setTimeout(syncHdrSticky, 0);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener("resize", syncHdrSticky);
      document.documentElement.style.removeProperty("--eq-hdr-sticky-h");
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
