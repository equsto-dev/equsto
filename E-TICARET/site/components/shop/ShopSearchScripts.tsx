"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

declare global {
  interface Window {
    __eqAramaBoot?: () => void;
  }
}

export default function ShopSearchScripts() {
  return (
    <>
      <Script src={`/eq-header-search.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-tips.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kuvet-gn-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-buzdolap-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-pisirme-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-dim-mm.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-arama-page.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
