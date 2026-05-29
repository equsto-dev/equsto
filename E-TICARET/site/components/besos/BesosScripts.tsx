"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isEnBesos = pathname?.startsWith("/en/besos") ?? false;

  return (
    <>
      {isEnBesos ? (
        <>
          <Script src={`/eq-besos-head-seo-config.js?v=${v}`} strategy="beforeInteractive" />
          <Script src={`/eq-besos-head-seo.js?v=${v}`} strategy="afterInteractive" />
        </>
      ) : null}
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
