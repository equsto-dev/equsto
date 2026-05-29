"use client";

import { useLayoutEffect } from "react";
import { mountEqShopChromeLayout } from "@/lib/shop/sync-shop-chrome";

const BESOS_BODY = "bd-page besos eq-shop min-h-full flex flex-col";

/** Bar Design — siyah zemin + vitrin chrome CSS hemen uygulanır */
export default function BesosBodyClass() {
  useLayoutEffect(() => {
    const prev = document.body.className;
    document.body.className = BESOS_BODY;

    const mountFooter = () => window.__eqMountMarketFooter?.();
    mountFooter();
    const t = window.setTimeout(mountFooter, 400);
    const unmountChrome = mountEqShopChromeLayout();

    return () => {
      window.clearTimeout(t);
      unmountChrome();
      document.body.className = prev;
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    __eqMountMarketFooter?: () => void;
  }
}
