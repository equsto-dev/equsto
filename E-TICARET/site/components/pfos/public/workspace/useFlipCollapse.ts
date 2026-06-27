"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/** FLIP: aynı konumda yükseklik/genişlik geçişi (220ms) */
export function useFlipCollapse(
  compact: boolean,
  enabled = true,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const prevCompact = useRef(compact);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (prevCompact.current === compact) return;

    const first = el.getBoundingClientRect();
    prevCompact.current = compact;

    requestAnimationFrame(() => {
      const last = el.getBoundingClientRect();
      const dy = first.top - last.top;
      const scaleY = first.height / Math.max(last.height, 1);

      el.style.transformOrigin = "top center";
      el.style.transform = `translateY(${dy}px) scaleY(${scaleY})`;
      el.style.transition = "none";

      requestAnimationFrame(() => {
        el.style.transition =
          "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease";
        el.style.transform = "";
        const onEnd = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", onEnd);
        };
        el.addEventListener("transitionend", onEnd);
      });
    });
  }, [compact, enabled]);

  return ref;
}
