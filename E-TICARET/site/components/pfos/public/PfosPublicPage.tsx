"use client";

import PfosEqustoChrome from "@/components/pfos/public/PfosEqustoChrome";
import PfosVersionBar from "@/components/pfos/public/PfosVersionBar";
import PfosPublicWizard from "@/components/pfos/public/PfosPublicWizard";
import PfosScripts from "@/components/pfos/public/PfosScripts";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

/** Canlı müşteri vitrini — /pfos (Next.js sihirbaz, pfos.html yerine) */
export default function PfosPublicPage() {
  const { t } = usePfosLabel();

  return (
    <>
      <PfosScripts />
      <div className={styles.pfosPage}>
        <PfosEqustoChrome />
        <div className={`pg ${styles.main}`}>
          <h1 className={styles.srOnly}>
            {t("Proje Fabrikası — Online Endüstriyel Mutfak Teklifi")}
          </h1>
          <p className={styles.srOnly}>
            {t(
              "Proje Fabrikası (PFOS), Equsto'nun kural-motoru tabanlı online ekipman teklif sistemidir. Konsept, kapasite ve alan bilgilerinize göre ekipman listesi ve fiyat tahmini üretir.",
            )}
          </p>

          <PfosPublicWizard />
        </div>
        <PfosVersionBar />
        <footer className="footer eq-mfoot" id="eq-shop-footer" />
      </div>
    </>
  );
}
