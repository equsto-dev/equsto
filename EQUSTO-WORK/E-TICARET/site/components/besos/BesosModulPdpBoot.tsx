"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __eqBootBesosModulPdp?: () => void;
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

function waitForBesosBoot(fn: () => void, attempt = 0) {
  if (typeof window.__eqBootBesosModulPdp === "function") {
    whenReady(fn);
    return;
  }
  if (attempt >= 80) return;
  window.setTimeout(() => waitForBesosBoot(fn, attempt + 1), 100);
}

/** Next.js client navigation — legacy PDP boot yeniden çalıştır */
export default function BesosModulPdpBoot() {
  const pathname = usePathname();

  useEffect(() => {
    if (!/\/besos\/modul\/[^/?#]+/i.test(pathname || "")) return;
    waitForBesosBoot(() => window.__eqBootBesosModulPdp?.());
  }, [pathname]);

  return null;
}
