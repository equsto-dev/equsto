"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

/** eq-site-urls.js öncesi — CDN + marka sırası */
export default function AssetCdnConfigScript() {
  const v = SHOP_ASSET_V;
  return (
    <>
      <Script src={`/eq-asset-cdn-config.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-brand-order.js?v=${v}`} strategy="beforeInteractive" />
    </>
  );
}
