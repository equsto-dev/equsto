"use client";

import Script from "next/script";
import type { ReactNode } from "react";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { GEO_PAGE_CSS } from "@/lib/vitrin/page-css";

type Props = {
  ssrContent?: ReactNode;
};

export default function GeoLandingPage({ ssrContent }: Props) {
  const v = SHOP_ASSET_V;
  return (
    <>
      <VitrinShell bodyClass="eq-shop eq-geo" extraCss={GEO_PAGE_CSS}>
        <div className="pg">
          <main
            id="eq-geo-main"
            className="eq-geo-main"
            data-eq-geo-ssr={ssrContent ? "1" : undefined}
            aria-live={ssrContent ? "off" : "polite"}
          >
            {ssrContent}
          </main>
        </div>
      </VitrinShell>
      <Script src={`/eq-geo-landing.js?v=${v}`} strategy="afterInteractive" />
      <Script src="/eq-analytics.js" strategy="lazyOnload" />
    </>
  );
}
