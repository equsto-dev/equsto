"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    equstoUpdateConsent?: (granted: boolean) => void;
  }
}

type ConsentState = "unknown" | "granted" | "denied";

export default function KvkkConsentActions() {
  const [state, setState] = useState<ConsentState>("unknown");

  useEffect(() => {
    try {
      const v = localStorage.getItem("equsto_cookie_consent");
      if (v === "granted" || v === "denied") setState(v);
    } catch {
      /* ignore */
    }
  }, []);

  function setConsent(granted: boolean) {
    if (typeof window.equstoUpdateConsent === "function") {
      window.equstoUpdateConsent(granted);
    } else {
      try {
        localStorage.setItem("equsto_cookie_consent", granted ? "granted" : "denied");
      } catch {
        /* ignore */
      }
    }
    setState(granted ? "granted" : "denied");
  }

  return (
    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <button type="button" className="btn btn-gold" onClick={() => setConsent(true)}>
        Analitik ve reklam çerezlerini kabul et
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => setConsent(false)}>
        Yalnızca zorunlu çerezler
      </button>
      <span style={{ fontSize: 13, opacity: 0.8 }}>
        Durum:{" "}
        {state === "granted"
          ? "kabul edildi"
          : state === "denied"
            ? "reddedildi"
            : "henüz seçilmedi (varsayılan: kapalı)"}
      </span>
    </div>
  );
}
