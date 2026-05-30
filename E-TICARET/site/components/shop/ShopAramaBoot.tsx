"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    __eqAramaBoot?: () => void;
  }
}

/** Next.js App Router: eq-arama-page.js DOM hazır olunca tetikle */
export default function ShopAramaBoot() {
  const params = useSearchParams();
  const q = params.get("q") || "";

  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    function attempt() {
      if (cancelled) return;
      tries += 1;
      if (typeof window.__eqAramaBoot === "function") {
        window.__eqAramaBoot();
        return;
      }
      if (tries < 100) window.setTimeout(attempt, 50);
    }

    attempt();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return null;
}
