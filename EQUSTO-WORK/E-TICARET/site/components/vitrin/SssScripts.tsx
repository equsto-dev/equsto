"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export default function SssScripts() {
  const v = SHOP_ASSET_V;
  return (
    <>
      <Script src={`/eq-sss-page.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-analytics.js" strategy="lazyOnload" />
    </>
  );
}
