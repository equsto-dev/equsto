"use client";

import { useEffect } from "react";

/** Provizyon başarılıysa sepeti temizle (ödeme sayfasına gitmeden önce silinmez). */
export default function OdemeSonucCartClear({ ok }: { ok: boolean }) {
  useEffect(() => {
    if (!ok) return;
    try {
      localStorage.removeItem("equsto-ecom-cart-v1");
      window.dispatchEvent(new Event("equsto-cart-changed"));
    } catch {
      /* ignore */
    }
  }, [ok]);
  return null;
}
