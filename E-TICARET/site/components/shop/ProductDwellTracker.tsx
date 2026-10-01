"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  localeFromPath,
  parseTrackablePath,
} from "@/lib/analytics/dwell-paths";

const SESSION_KEY = "eq_dwell_sid";
const ENDPOINT = "/api/analytics/product-dwell";
const MIN_MS = 2_000;

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
 * Sayfa süre takibi — shop PDP, Besos ve PFOS.
 * Görünür süre (sekme gizliyken durur). Minimum 2 sn; terk / kapanışta gönderilir.
 * Mobil: kısa süreli visibilitychange biriken süreyi silmez.
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
    const path = pathname || "";
    const pathInfo = parseTrackablePath(path);
    const metaSlug = String(slug || "").trim();
    const metaDept = String(dept || "").trim();
    if (!metaSlug || !metaDept) {
      if (!pathInfo) return;
    }

    sent.current = false;
    accumulated.current = 0;
    visibleStarted.current =
      document.visibilityState === "visible" ? Date.now() : null;

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

    /** finalLeave=false: kısa süreyi koru (mobil app switch). finalLeave=true: sayfa terk. */
    function flush(finalLeave: boolean) {
      if (sent.current) return;
      pause();
      const durationMs = accumulated.current;
      if (durationMs < MIN_MS) {
        if (finalLeave) accumulated.current = 0;
        return;
      }
      accumulated.current = 0;
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
        path,
        slug: meta.slug || pathInfo?.slug || metaSlug,
        dept: meta.dept || pathInfo?.dept || metaDept,
        productId: meta.productId || null,
        title: meta.title || "",
        brand: meta.brand || "",
        durationMs,
        locale: pathInfo?.locale || localeFromPath(path),
        memberId: memberId || null,
        referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush(false);
      } else {
        sent.current = false;
        resume();
      }
    }

    function onPageHide() {
      flush(true);
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      flush(true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pathname, slug, dept]);

  return null;
}
