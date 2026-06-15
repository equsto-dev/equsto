"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export default function ShopProductScripts() {
  return (
    <>
      <Script
        id="eq-pdp-page-css-bootstrap"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(document.querySelector('link[data-eq-pdp-page-css]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href='/eq-product-page.css?v=${v}';l.setAttribute('data-eq-pdp-page-css','1');document.head.appendChild(l);}catch(e){}})();`,
        }}
      />
      <Script
        id="eq-pdp-page-body-class"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html:
            '(function(){function a(){if(document.body){document.body.classList.add("eq-pdp-page");return!0}return!1}if(!a()){var n=0,t=setInterval(function(){if(a()||++n>200)clearInterval(t)},10)}})();',
        }}
      />
      <Script
        id="eq-pdp-mobile-buybar-css"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(document.getElementById("eq-pdp-mobile-buybar-css"))return;var s=document.createElement("style");s.id="eq-pdp-mobile-buybar-css";s.textContent='@media (max-width:768px){body:has(#eq-pdp-mobile-buybar) #eq-bottom-tabbar{display:none!important}body:has(#eq-pdp-mobile-buybar){padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))!important}body:has(#eq-pdp-mobile-buybar) .eq-epdp-hero .eq-cmf-buybox{display:none!important}#eq-pdp-mobile-buybar{position:fixed!important;bottom:0!important;left:0!important;right:0!important;z-index:500!important;background:#fff!important;box-shadow:0 -4px 16px rgba(0,0,0,.1)!important;border-top:1px solid #e5e7eb!important;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px))!important;margin:0!important;box-sizing:border-box!important}#eq-pdp-mobile-buybar .eq-pdp-mobile-buybar__inner{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important}#eq-pdp-mobile-buybar .eq-pdp-mobile-buybar__actions{display:flex!important;align-items:center!important;gap:8px!important;flex:1 1 auto!important;justify-content:flex-end!important;min-width:0!important}#eq-pdp-mobile-buybar .eq-cmf-btn--cart{min-height:38px!important;height:38px!important;font-size:13px!important;font-weight:700!important;padding:0 16px!important;border-radius:4px!important;max-width:160px!important}}';document.head.appendChild(s);}catch(e){}})();`,
        }}
      />
      <Script src="/ecom-data.js" strategy="beforeInteractive" />
      <Script src={`/ecom-cart.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-shop-catalog-bootstrap.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-vendor-sanitize.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-competitor-redirects.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-display-terminology.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-pricing-core.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-fiyatlar-bridge.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-filter-column.js" strategy="afterInteractive" />
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-page-inline.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-product-reviews.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
