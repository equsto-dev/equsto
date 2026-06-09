"use client";

import { useState } from "react";
import PfosEqustoChrome from "@/components/pfos/public/PfosEqustoChrome";
import PfosListeUpload from "@/components/pfos/public/PfosListeUpload";
import PfosPublicWizard from "@/components/pfos/public/PfosPublicWizard";
import PfosScripts from "@/components/pfos/public/PfosScripts";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

type PfosMode = "wizard" | "liste";

/** Canlı müşteri vitrini — /pfos (Next.js sihirbaz, pfos.html yerine) */
export default function PfosPublicPage() {
  const { t } = usePfosLabel();
  const [mode, setMode] = useState<PfosMode>("wizard");

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
