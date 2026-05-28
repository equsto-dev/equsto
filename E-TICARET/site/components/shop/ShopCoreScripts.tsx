"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

/** Ortak vitrin JS — theme, i18n, nav, sepet rozeti */
export default function ShopCoreScripts() {
  return (
    <>
      <Script src={`/theme.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-i18n.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-logo.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/nav.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-auth-api.js" strategy="afterInteractive" />
      <Script src={`/equsto-member.js?v=${v}`} strategy="lazyOnload" />
      <Script src={`/equsto-auth-client.js?v=${v}`} strategy="lazyOnload" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => (window as Window & { EqustoCart?: { syncBadge?: () => void } }).EqustoCart?.syncBadge?.()}
      />
      <Script src={`/eq-footer.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/contact.js?v=${v}`} strategy="lazyOnload" />
    </>
  );
}
