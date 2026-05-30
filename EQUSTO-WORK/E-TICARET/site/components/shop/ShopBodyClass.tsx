"use client";

import { useEffect } from "react";
import { mountEqShopChromeLayout } from "@/lib/shop/sync-shop-chrome";

/** Legacy eq-dept-plp.js body class + data-eq-dept attribute */
export default function ShopBodyClass({
  className,
  dataDept,
}: {
  className: string;
  dataDept?: string;
}) {
  useEffect(() => {
    const prevClass = document.body.className;
    const prevDept = document.body.getAttribute("data-eq-dept");
    document.body.className = className;
    if (dataDept) document.body.setAttribute("data-eq-dept", dataDept);
    else document.body.removeAttribute("data-eq-dept");

    const mountFooter = () => {
      try {
        window.__eqMountMarketFooter?.();
      } catch (_) {}
    };
    mountFooter();
    const t = window.setTimeout(mountFooter, 400);

    try {
      window.equstoSyncContactFab?.();
      window.eqSyncMobileChrome?.();
    } catch (_) {}

    const unmountChrome = mountEqShopChromeLayout();

    return () => {
      window.clearTimeout(t);
      unmountChrome();
      document.body.className = prevClass;
      if (prevDept) document.body.setAttribute("data-eq-dept", prevDept);
      else document.body.removeAttribute("data-eq-dept");
    };
  }, [className, dataDept]);

  return null;
}

declare global {
  interface Window {
    __eqMountMarketFooter?: () => void;
    equstoSyncContactFab?: () => void;
    eqSyncMobileChrome?: () => void;
  }
}
