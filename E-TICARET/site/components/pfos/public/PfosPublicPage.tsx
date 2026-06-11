"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PfosEqustoChrome from "@/components/pfos/public/PfosEqustoChrome";
import PfosListeUpload from "@/components/pfos/public/PfosListeUpload";
import PfosPublicWizard from "@/components/pfos/public/PfosPublicWizard";
import PfosScripts from "@/components/pfos/public/PfosScripts";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

type PfosMode = "wizard" | "liste";

function modeFromSearchParams(sp: URLSearchParams | null): PfosMode {
  const raw = sp?.get("mode")?.toLowerCase() ?? "";
  if (raw === "liste" || raw === "upload" || raw === "liste-yukle" || raw === "yukle") {
    return "liste";
  }
  return "wizard";
}

/** Canlı müşteri vitrini — /pfos (Next.js sihirbaz, pfos.html yerine) */
export default function PfosPublicPage() {
  const { t } = usePfosLabel();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PfosMode>(() => modeFromSearchParams(searchParams));

  useEffect(() => {
    setMode(modeFromSearchParams(searchParams));
  }, [searchParams]);

  return (
    <>
      <PfosScripts />
      <div className={styles.pfosPage}>
        <PfosEqustoChrome />
        <div className={styles.main}>
          <h1 className={styles.srOnly}>
            {t("Proje Fabrikası — Online Endüstriyel Mutfak Teklifi")}
          </h1>
          <p className={styles.srOnly}>
            {t(
              "Proje Fabrikası (PFOS), Equsto'nun kural-motoru tabanlı online ekipman teklif sistemidir. Konsept, kapasite ve alan bilgilerinize göre ekipman listesi ve fiyat tahmini üretir.",
            )}
          </p>

          <nav className={styles.modeTabs} aria-label={t("PFOS giriş modu")}>
            <button
              type="button"
              className={`${styles.modeTab}${mode === "wizard" ? ` ${styles.modeTabActive}` : ""}`}
              onClick={() => setMode("wizard")}
            >
              {t("Proje sihirbazı")}
            </button>
            <button
              type="button"
              className={`${styles.modeTab}${mode === "liste" ? ` ${styles.modeTabActive}` : ""}`}
              onClick={() => setMode("liste")}
            >
              {t("Liste yükle")}
            </button>
          </nav>

          {mode === "wizard" ? <PfosPublicWizard /> : <PfosListeUpload />}
        </div>
        <footer className="footer eq-mfoot" id="eq-shop-footer" />
      </div>
    </>
  );
}
