"use client";

import { useEffect, useId } from "react";

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export default function JsonLdScript({ data }: { data: unknown }) {
  if (typeof window === "undefined") return null;

  const content = JSON.stringify(data);
  const contentHash = hashString(content);
  const instanceId = useId();
  const scriptId = `ld-${contentHash}-${instanceId}`;

  useEffect(() => {
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = content;
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [scriptId, content]);

  return null;
}
