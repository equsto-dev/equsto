"use client";

import Script from "next/script";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const MARKA_HUB_CSS = `
body.eq-shop.eq-marka-hub:not(.admin-app):not(.bd-page) .pg{
  flex:1 1 auto!important;align-self:stretch!important;width:100%!important;max-width:none!important;
  margin:0!important;background:transparent!important;
}
body.eq-marka-hub .breadcrumb{display:none!important;}
body.eq-marka-hub #eq-filter-col{display:none!important;}
`;

export default function MarkaHubScripts() {
  const v = SHOP_ASSET_V;
  return (
    <>
      <style id="eq-marka-hub-page-css">{MARKA_HUB_CSS}</style>
      <AssetCdnConfigScript />
      <Script src={`/eq-site-urls.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-display-terminology.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-shop-catalog-bootstrap.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-filter-column.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/eq-category-shell.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => {
          const id = "eq-marka-plp-boot-js";
          if (document.getElementById(id)) return;
          const el = document.createElement("script");
          el.id = id;
          el.src = `/eq-marka-plp-boot.js?v=${v}`;
          el.async = false;
          document.body.appendChild(el);
        }}
      />
    </>
  );
}
