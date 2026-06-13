"use client";

import Script from "next/script";
import { useEffect } from "react";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export default function ShopPlpScripts() {
  useEffect(() => {
    const sel = document.getElementById("eq-dept-plp-sort") as HTMLSelectElement | null;
    if (!sel) return;
    const onChange = () => {
      const fn = (window as Window & { __eqDeptPlpSetSort?: (s: string) => void }).__eqDeptPlpSetSort;
      fn?.(sel.value);
    };
    sel.addEventListener("change", onChange);
    return () => sel.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <Script src={`/eq-i18n.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-display-terminology.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-tips.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kuvet-gn-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-buzdolap-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-dept-plp-config.js" strategy="afterInteractive" />
      <Script src={`/eq-dept-cm-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/equsto-pricing-core.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-fiyatlar-bridge.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-vendor-sanitize.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-product-card-tint.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-plp.js?v=${v}`} strategy="afterInteractive" />
    </>
  );
}
