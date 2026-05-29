"use client";

import { createPortal } from "react-dom";
import { useLayoutEffect, useState, type ReactNode } from "react";

function chromeRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("eq-shop-chrome-root");
}

/** Üst krom — body kökünde; viewport üstüne yapışık sticky */
export default function ShopChromePortal({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(chromeRoot);

  useLayoutEffect(() => {
    if (!root) setRoot(chromeRoot());
  }, [root]);

  if (!root) return null;
  return createPortal(children, root);
}
