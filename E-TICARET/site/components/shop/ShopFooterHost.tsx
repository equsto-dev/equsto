"use client";

import { useEffect } from "react";

type ShopFooterHostProps = {
  id?: string;
};

function mountMarketFooter() {
  window.__eqMountMarketFooter?.();
}

/** eq-footer.js — React hydration sonrası vitrin alt bandı */
export default function ShopFooterHost({ id = "eq-shop-footer" }: ShopFooterHostProps) {
  useEffect(() => {
    mountMarketFooter();
    const timers = [80, 450, 1200].map((ms) => window.setTimeout(mountMarketFooter, ms));
    window.addEventListener("equsto:i18n-ready", mountMarketFooter);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("equsto:i18n-ready", mountMarketFooter);
    };
  }, []);

  return <footer className="footer" id={id} suppressHydrationWarning />;
}

declare global {
  interface Window {
    __eqMountMarketFooter?: () => void;
  }
}
