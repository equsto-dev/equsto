"use client";

import Script from "next/script";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { GEO_PAGE_CSS } from "@/lib/vitrin/page-css";

export default function GeoLandingClient() {
  const v = SHOP_ASSET_V;
  return (
    <>
      <VitrinShell bodyClass="eq-shop eq-geo" extraCss={GEO_PAGE_CSS}>
        <div className="pg">
          <main id="eq-geo-main" className="eq-geo-main" aria-live="polite" />
        </div>
      </VitrinShell>
      <Script src={`/eq-geo-landing.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-analytics.js" strategy="lazyOnload" />
    </>
  );
}
