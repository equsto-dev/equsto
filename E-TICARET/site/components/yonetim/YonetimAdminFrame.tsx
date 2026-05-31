"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getProToken } from "@/lib/pro-admin-client";
import { yonetimPathToAdminSrc } from "@/lib/yonetim/admin-routes";
import { syncYonetimBearerToAdmin } from "@/lib/yonetim/sync-admin-bearer";

export default function YonetimAdminFrame({
  legacyPrefix = "",
}: {
  legacyPrefix?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [ready, setReady] = useState(false);

  const segments = useMemo(() => {
    const raw = params.path;
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [String(raw)];
    const prefix = legacyPrefix.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (prefix.length && list.slice(0, prefix.length).join("/") === prefix.join("/")) {
      return list.slice(prefix.length);
    }
    return list;
  }, [params.path, legacyPrefix]);

  const adminSrc = useMemo(() => yonetimPathToAdminSrc(segments), [segments]);

  useEffect(() => {
    const tok = getProToken();
    if (!tok) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/yonetim",
      );
      router.replace(`/yonetim/giris?next=${next}`);
      return;
    }
    syncYonetimBearerToAdmin();
    setReady(true);
  }, [router, searchParams]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
          background: "#f5f7fb",
        }}
      >
        Founder Decision Panel yükleniyor…
      </div>
    );
  }

  return (
    <iframe
      key={adminSrc}
      title="Equsto Founder Decision Panel"
      src={adminSrc}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        zIndex: 0,
      }}
    />
  );
}
