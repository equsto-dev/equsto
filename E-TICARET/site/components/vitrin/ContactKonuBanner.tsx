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
        el.textContent = "Talep konusu: " + String(konu).trim();
        el.classList.add("is-on");
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
