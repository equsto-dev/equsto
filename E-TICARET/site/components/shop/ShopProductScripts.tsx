"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export default function ShopProductScripts() {
  return (
    <>
      <Script src={`/eq-product-reviews.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-merchant-schema.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/ecom-data.js" strategy="afterInteractive" />
      <Script src={`/eq-shop-catalog-bootstrap.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-vendor-sanitize.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-competitor-redirects.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-display-terminology.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-pricing-core.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-fiyatlar-bridge.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-filter-column.js" strategy="afterInteractive" />
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-page-inline.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
