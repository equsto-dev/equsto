"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __eqBootBesosUrbanBarPdp?: () => void;
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

function waitForBoot(fn: () => void, attempt = 0) {
  if (typeof window.__eqBootBesosUrbanBarPdp === "function") {
    whenReady(fn);
    return;
  }
  if (attempt >= 80) return;
  window.setTimeout(() => waitForBoot(fn, attempt + 1), 100);
}

/** Next.js client navigation — Besos Urban Bar PDP boot yeniden çalıştır */
export default function BesosUrbanBarPdpBoot() {
  const pathname = usePathname();

  useEffect(() => {
    if (!/\/(?:en\/)?besos\/(bardaklar|bar-ekipman)\/[^/?#]+/i.test(pathname || "")) return;
    waitForBoot(() => window.__eqBootBesosUrbanBarPdp?.());
  }, [pathname]);

  return null;
}
