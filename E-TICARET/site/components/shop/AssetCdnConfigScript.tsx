"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

/** eq-site-urls.js öncesi — NEXT_PUBLIC_ASSET_CDN_URL → window.__EQUSTO_ASSET_CDN */
export default function AssetCdnConfigScript() {
  return (
    <Script
      src={`/eq-asset-cdn-config.js?v=${SHOP_ASSET_V}`}
      strategy="beforeInteractive"
    />
  );
}
