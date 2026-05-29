"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useState, type ReactNode } from "react";

/** Üst krom — body kökünde; viewport üstüne yapışık sticky */
export default function ShopChromePortal({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setRoot(document.getElementById("eq-shop-chrome-root"));
  }, []);

  if (!root) return null;
  return createPortal(children, root);
}
