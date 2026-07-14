"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "eq_dwell_sid";
const ENDPOINT = "/api/analytics/product-dwell";

type ProductMeta = {
  slug: string;
  dept?: string;
  productId?: string;
  title?: string;
  brand?: string;
};

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (id && id.length >= 8) return id;
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

function parseShopPath(pathname: string): { locale: string; dept: string; slug: string } | null {
  const m = pathname.match(/^\/(en\/)?shop\/([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  return {
    locale: m[1] ? "en" : "tr",
    dept: decodeURIComponent(m[2]),
    slug: decodeURIComponent(m[3]),
  };
}

function sendDwell(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

type Props = {
  slug: string;
  dept: string;
  productId?: string;
  title?: string;
  brand?: string;
};

/**
 * Ürün PDP süre takibi — görünür süre (sekme gizliyken durur).
 * Minimum 2 sn; sayfa terk / sekme kapanışında gönderilir.
 */
export default function ProductDwellTracker({
  slug,
  dept,
  productId,
  title,
  brand,
}: Props) {
  const pathname = usePathname();
  const metaRef = useRef<ProductMeta>({ slug, dept, productId, title, brand });
  const visibleStarted = useRef<number | null>(null);
  const accumulated = useRef(0);
  const sent = useRef(false);

  useEffect(() => {
    metaRef.current = { slug, dept, productId, title, brand };
  }, [slug, dept, productId, title, brand]);

  useEffect(() => {
    const pathInfo = parseShopPath(pathname || "");
    if (!pathInfo) return;

    sent.current = false;
    accumulated.current = 0;
    visibleStarted.current = document.visibilityState === "visible" ? Date.now() : null;

    function pause() {
      if (visibleStarted.current != null) {
        accumulated.current += Date.now() - visibleStarted.current;
        visibleStarted.current = null;
      }
    }

    function resume() {
      if (document.visibilityState === "visible" && visibleStarted.current == null) {
        visibleStarted.current = Date.now();
      }
    }

    function flush() {
      if (sent.current) return;
      pause();
      const durationMs = accumulated.current;
      accumulated.current = 0;
      if (durationMs < 2000) return;
      sent.current = true;

      const meta = metaRef.current;
      let memberId: string | undefined;
      try {
        const w = window as Window & { equstoGetMemberId?: () => string };
        if (typeof w.equstoGetMemberId === "function") {
          memberId = w.equstoGetMemberId() || undefined;
        }
      } catch {
        /* ignore */
      }

      sendDwell({
        sessionId: getOrCreateSessionId(),
        path: pathname || "",
        slug: meta.slug || pathInfo!.slug,
        dept: meta.dept || pathInfo!.dept,
        productId: meta.productId || null,
        title: meta.title || "",
        brand: meta.brand || "",
        durationMs,
        locale: pathInfo!.locale,
        memberId: memberId || null,
        referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
      } else {
        sent.current = false;
        resume();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname, slug]);

  return null;
}
