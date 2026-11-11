"use client";

import Script from "next/script";
import AssetCdnConfigScript from "@/components/shop/AssetCdnConfigScript";
import { ECOM_ASSET_V, SHOP_ASSET_V } from "@/lib/shop/assets";

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
  const ecomV = ECOM_ASSET_V;
  const markaV = `${v}&m=20260919-cambro-official`;
  return (
    <>
      <style id="eq-marka-hub-page-css">{MARKA_HUB_CSS}</style>
      <AssetCdnConfigScript />
      <Script src={`/eq-price-display.js?v=${ecomV}`} strategy="beforeInteractive" />
      <Script src={`/eq-site-urls.js?v=${markaV}`} strategy="beforeInteractive" />
      <Script src={`/eq-marka-scripts-loader.js?v=${markaV}&m=20261111-quote-wa-cta`} strategy="afterInteractive" />
    </>
  );
}
