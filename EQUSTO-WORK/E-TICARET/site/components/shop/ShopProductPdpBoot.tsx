"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __eqBootProductPage?: () => void;
    eqI18nReady?: Promise<void>;
  }
}

function whenReady(fn: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  try {
    if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
      window.eqI18nReady.then(run).catch(run);
      window.setTimeout(run, 3500);
      return;
    }
  } catch (_) {}
  run();
}

function waitForProductBoot(fn: () => void, attempt = 0) {
  if (typeof window.__eqBootProductPage === "function") {
    whenReady(fn);
    return;
  }
  if (attempt >= 80) return;
  window.setTimeout(() => waitForProductBoot(fn, attempt + 1), 100);
}

/** Next.js client navigation — shop PDP boot yeniden çalıştır */
export default function ShopProductPdpBoot() {
  const pathname = usePathname();

  useEffect(() => {
    const p = pathname || "";
    if (!/\/(?:shop|urunler)\/[^/]+\/[^/?#]+/i.test(p) && !/\/urun\/[^/?#]+/i.test(p)) return;
    if (/\/besos\/modul\//i.test(p)) return;
    waitForProductBoot(() => window.__eqBootProductPage?.());
  }, [pathname]);

  return null;
}
