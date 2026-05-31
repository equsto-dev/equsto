import YonetimAdminFrame from "@/components/yonetim/YonetimAdminFrame";
import { Suspense } from "react";

/** Eski admin.html gömülü görünüm — /yonetim/legacy, /yonetim/legacy/pfos vb. */
export default function YonetimLegacyPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, fontFamily: "system-ui" }}>Legacy admin yükleniyor…</div>
      }
    >
      <YonetimAdminFrame legacyPrefix="/yonetim/legacy" />
    </Suspense>
  );
}
