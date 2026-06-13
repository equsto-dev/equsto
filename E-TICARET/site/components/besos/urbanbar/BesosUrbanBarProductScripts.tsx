"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

/** Besos Urban Bar PDP — shop E-PDP + sepet */
export default function BesosUrbanBarProductScripts() {
  return (
    <>
      <Script
        id="eq-pdp-page-css-bootstrap"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(document.querySelector('link[data-eq-pdp-page-css]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href='/eq-product-page.css?v=${v}';l.setAttribute('data-eq-pdp-page-css','1');document.head.appendChild(l);}catch(e){}})();`,
        }}
      />
      <Script src="/ecom-data.js" strategy="beforeInteractive" />
      <Script src={`/eq-shop-catalog-bootstrap.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-vendor-sanitize.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-display-terminology.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-pricing-core.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-fiyatlar-bridge.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-filter-column.js" strategy="afterInteractive" />
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => window.EqustoCart?.syncBadge?.()}
      />
      <Script src={`/eq-besos-urbanbar-pdp-boot.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-page-inline.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-reviews.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
