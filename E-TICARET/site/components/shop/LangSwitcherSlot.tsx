"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __eqRemountLangSwitcher?: () => void;
  }
}

/** eq-i18n dil şeridi — React chrome yenilense de kalır */
export default function LangSwitcherSlot() {
  useEffect(() => {
    function remount() {
      try {
        window.__eqRemountLangSwitcher?.();
      } catch (_) {}
    }
    remount();
    window.addEventListener("equsto:i18n-ready", remount);
    return () => window.removeEventListener("equsto:i18n-ready", remount);
  }, []);

  return <span data-eq-lang-slot className="eq-lang-slot" />;
}
