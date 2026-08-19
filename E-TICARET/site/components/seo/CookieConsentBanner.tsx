"use client";
import { useEffect, useState } from "react";

const CONSENT_KEY = "equsto_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CONSENT_KEY);
      if (!existing) setVisible(true);
    } catch {
      /* localStorage erişilemezse banner'ı gösterme */
    }
  }, []);

  function handleChoice(granted: boolean) {
    const w = window as Window & { equstoUpdateConsent?: (g: boolean) => void };
    if (typeof w.equstoUpdateConsent === "function") {
      w.equstoUpdateConsent(granted);
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez izni"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#111",
        color: "#fff",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <p style={{ margin: 0, fontSize: 14, flex: "1 1 320px" }}>
        Sitemizi daha iyi bir deneyim sunmak için çerezler kullanıyoruz. Detaylar için{" "}
        <a href="/gizlilik-politikasi" style={{ color: "#5EEAD4", textDecoration: "underline" }}>
          Gizlilik Politikası
        </a>
        &apos;nı inceleyebilirsiniz.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => handleChoice(false)}
          style={{
            padding: "8px 16px",
            background: "transparent",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Reddet
        </button>
        <button
          onClick={() => handleChoice(true)}
          style={{
            padding: "8px 16px",
            background: "#5EEAD4",
            color: "#0B0C0E",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Kabul Et
        </button>
      </div>
    </div>
  );
}