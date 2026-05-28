"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export default function ShopCartScripts() {
  return (
    <>
      <Script src="/ecom-data.js" strategy="afterInteractive" />
      <Script src={`/eq-shop-header.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
