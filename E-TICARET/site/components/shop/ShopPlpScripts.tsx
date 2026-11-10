"use client";

import Script from "next/script";
import { useEffect } from "react";
import { ECOM_ASSET_V, SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;
const catalogV = ECOM_ASSET_V;
/** Cache bust — Ads Faz 0 PLP LCP / script sırası */
const m = "20261110-ads-faz0";

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script load failed: " + src));
    document.body.appendChild(s);
  });
}

export default function ShopPlpScripts() {
  useEffect(() => {
    const sel = document.getElementById("eq-dept-plp-sort") as HTMLSelectElement | null;
    if (!sel) return;
    const onChange = () => {
      const fn = (window as Window & { __eqDeptPlpSetSort?: (s: string) => void }).__eqDeptPlpSetSort;
      fn?.(sel.value);
    };
    sel.addEventListener("change", onChange);
    return () => sel.removeEventListener("change", onChange);
  }, []);

  /** Filtre yardımcıları + kozmetik script’ler: ilk boyamadan sonra idle’da */
  useEffect(() => {
    let cancelled = false;
    const deferred = [
      `/eq-i18n.js?v=${v}&m=${m}`,
      `/eq-display-terminology.js?v=${v}&m=${m}`,
      `/eq-dept-tips.js?v=${v}&m=${m}`,
      `/eq-product-card-tint.js?v=${v}&m=${m}`,
    ];

    const run = () => {
      if (cancelled) return;
      deferred
        .reduce((p, src) => p.then(() => (cancelled ? undefined : loadScriptOnce(src))), Promise.resolve())
        .catch(() => {});
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    let idleId = 0;
    let timeoutId = 0;
    if (typeof ric === "function") {
      idleId = ric(run, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(run, 1200) as unknown as number;
    }
    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {/* Kritik path: fiyat + facet + katalog grid */}
      <Script src={`/eq-price-display.js?v=${v}`} strategy="beforeInteractive" />
      <Script src={`/eq-kuvet-gn-facets.js?v=${v}&m=${m}`} strategy="afterInteractive" />
      <Script src={`/eq-dim-mm.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-olcu-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-buzdolap-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-pisirme-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kahve-facets.js?v=${v}&m=${m}`} strategy="afterInteractive" />
      <Script src={`/eq-komurlu-izgara-facets.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-plp-config.js?v=${catalogV}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-cm-facets.js?v=${v}&m=${m}`} strategy="afterInteractive" />
      <Script src={`/equsto-pricing-core.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-kur-live.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-fiyatlar-bridge.js?v=${v}`} strategy="afterInteractive" />
      <Script src={`/eq-vendor-sanitize.js?v=${v}&m=${m}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-plp.js?v=${catalogV}&m=${m}`} strategy="afterInteractive" />
      <Script src={`/eq-dept-plp-filter-mob.js?v=${v}&m=${m}`} strategy="afterInteractive" />
    </>
  );
}
