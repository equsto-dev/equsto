"use client";

import { useEffect } from "react";

/** ?konu= ile gelen iletişim talebi */
export default function ContactKonuBanner() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(String(window.location.search || "").replace(/^\?/, ""));
      const konu = q.get("konu");
      const el = document.getElementById("ct-konu");
      if (konu && el) {
        const prefix =
          typeof window.eqT === "function"
            ? window.eqT("contact.konu_prefix", "Talep konusu: ")
            : "Talep konusu: ";
        el.textContent = prefix + String(konu).trim();
        el.classList.add("is-on");
      }
    } catch {
      /* ignore */
    }
    const onI18n = () => {
      try {
        const q = new URLSearchParams(String(window.location.search || "").replace(/^\?/, ""));
        const konu = q.get("konu");
        const el = document.getElementById("ct-konu");
        if (konu && el && el.classList.contains("is-on")) {
          const prefix =
            typeof window.eqT === "function"
              ? window.eqT("contact.konu_prefix", "Talep konusu: ")
              : "Talep konusu: ";
          el.textContent = prefix + String(konu).trim();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("equsto:i18n-ready", onI18n);
    return () => window.removeEventListener("equsto:i18n-ready", onI18n);
  }, []);
  return null;
}

declare global {
  interface Window {
    eqT?: (key: string, fallback?: string | null) => string;
  }
}
