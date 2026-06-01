"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import type { WizardQuestion } from "@/lib/pfos/wizard/public-flow";

let labelsCache: Record<string, string> | null = null;
let labelsPromise: Promise<Record<string, string>> | null = null;

function loadPfosLabels(): Promise<Record<string, string>> {
  if (labelsCache) return Promise.resolve(labelsCache);
  if (labelsPromise) return labelsPromise;
  labelsPromise = fetch(`/i18n/pfos-labels-en.json?v=${SHOP_ASSET_V}`, {
    credentials: "same-origin",
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : { labels: {} }))
    .then((j) => {
      labelsCache = (j?.labels as Record<string, string>) || {};
      return labelsCache;
    })
    .catch(() => {
      labelsCache = {};
      return labelsCache;
    });
  return labelsPromise;
}

/** /en/pfos veya global eqLang=en */
export function usePfosEn(): boolean {
  const pathname = usePathname();
  const pathEn = pathname?.startsWith("/en") ?? false;
  const [eqEn, setEqEn] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        setEqEn(
          typeof window !== "undefined" &&
            (window as Window & { eqLang?: string }).eqLang === "en",
        );
      } catch {
        setEqEn(false);
      }
    };
    check();
    window.addEventListener("eq-lang-change", check);
    window.addEventListener("equsto:i18n-ready", check);
    return () => {
      window.removeEventListener("eq-lang-change", check);
      window.removeEventListener("equsto:i18n-ready", check);
    };
  }, []);
  return pathEn || eqEn;
}

export function usePfosLabel() {
  const isEn = usePfosEn();
  const [ready, setReady] = useState(!isEn || !!labelsCache);

  useEffect(() => {
    if (!isEn) {
      setReady(true);
      return;
    }
    void loadPfosLabels().then(() => setReady(true));
  }, [isEn]);

  const t = useCallback(
    (tr: string | null | undefined): string => {
      const s = String(tr ?? "").trim();
      if (!s || !isEn) return String(tr ?? "");
      if (typeof window !== "undefined" && typeof window.eqPfosLabel === "function") {
        const via = window.eqPfosLabel(s);
        if (via && via !== s) return via;
      }
      if (labelsCache && labelsCache[s]) return labelsCache[s];
      return s;
    },
    [isEn, ready],
  );

  return { isEn, t, ready };
}

export function translateWizardQuestions(
  questions: WizardQuestion[],
  t: (s: string) => string,
): WizardQuestion[] {
  return questions.map((q) => {
    const opts = Array.isArray(q.options)
      ? (q.options as string[]).map((o) => t(String(o)))
      : q.options;
    return {
      ...q,
      text: q.text ? t(String(q.text)) : q.text,
      note: q.note ? t(String(q.note)) : q.note,
      options: opts,
    };
  });
}

declare global {
  interface Window {
    eqPfosLabel?: (tr: string) => string;
  }
}
