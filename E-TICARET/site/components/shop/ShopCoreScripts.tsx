"use client";

import Script from "next/script";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { ECOM_ASSET_V, SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;
const cartV = ECOM_ASSET_V;

/** Ortak vitrin JS — ilk boyayı kilitlemesin (mobil Safari). Cihaz sınıfı layout inline boot. */
export default function ShopCoreScripts() {
  return (
    <>
      <Script src={`/eq-device.js?v=${v}&m=20260919-shell`} strategy="afterInteractive" />
      <Script src={`/eq-price-display.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/theme.js?v=${v}`} strategy="afterInteractive" />
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/eq-i18n.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => {
          try {
            if (typeof window.__eqRerenderNav === "function") window.__eqRerenderNav();
          } catch (_) {}
        }}
      />
      <Script src={`/equsto-logo.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/nav.js?v=${v}&m=20260924-kahve-filtre`} strategy="afterInteractive" />
      <Script src="/eq-auth-api.js" strategy="afterInteractive" />
      <Script src={`/equsto-member.js?v=${v}&m=20260919-no-hdr-logout`} strategy="afterInteractive" />
      <Script src={`/equsto-auth-client.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${cartV}`}
        strategy="afterInteractive"
        onReady={() => (window as Window & { EqustoCart?: { syncBadge?: () => void } }).EqustoCart?.syncBadge?.()}
      />
      <Script
        src={`/contact.js?v=${v}&m=20260919-paint`}
        strategy="afterInteractive"
        onReady={() => {
          try {
            window.equstoSyncContactFab?.();
            window.eqSyncMobileChrome?.();
          } catch (_) {}
        }}
      />
      <Script src={`/eq-photo-search.js?v=${v}`} strategy="lazyOnload" />
      <Script src={`/eq-footer.js?v=${v}&m=20260918-seo-footer`} strategy="lazyOnload" />
      <Script src={`/portabianco-cafemarkt-img-map.js?v=${v}`} strategy="lazyOnload" />
    </>
  );
}
