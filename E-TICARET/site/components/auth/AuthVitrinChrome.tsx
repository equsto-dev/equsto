"use client";

import ShopDrawerShell from "@/components/shop/ShopDrawerShell";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import { mountEqShopChromeLayout } from "@/lib/shop/sync-shop-chrome";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import { useEffect } from "react";
import Script from "next/script";

const v = SHOP_ASSET_V;

/** Üye girişi — vitrin üst bant + kategori çekmecesi */
export default function AuthVitrinChrome() {
  useEffect(() => mountEqShopChromeLayout(), []);

  return (
    <>
      <ShopEqustoChrome />
      <ShopDrawerShell />
      <Script src={`/nav.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-header-search.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-shop-header.js?v=${v}`} strategy="afterInteractive" />
      <Script
        src={`/ecom-cart.js?v=${v}`}
        strategy="afterInteractive"
        onReady={() => {
          try {
            (
              window as Window & { EqustoCart?: { syncBadge?: () => void } }
            ).EqustoCart?.syncBadge?.();
          } catch (_) {}
        }}
      />
    </>
  );
}
