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
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/eq-arama-page.js?v=${v}`}
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.__eqAramaBoot?.();
          } catch (_) {}
        }}
      />
    </>
  );
}
