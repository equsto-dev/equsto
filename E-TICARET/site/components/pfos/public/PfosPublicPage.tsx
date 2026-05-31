"use client";

import PfosEqustoChrome from "@/components/pfos/public/PfosEqustoChrome";
import PfosPublicWizard from "@/components/pfos/public/PfosPublicWizard";
import PfosScripts from "@/components/pfos/public/PfosScripts";
import styles from "@/components/pfos/public/pfos-public.module.css";

/** Canlı müşteri vitrini — /pfos (Next.js sihirbaz, pfos.html yerine) */
export default function PfosPublicPage() {
  return (
    <>
      <PfosScripts />
      <div className={styles.pfosPage}>
        <PfosEqustoChrome />
        <div className={styles.main}>
          <h1 className={styles.srOnly}>
            Proje Fabrikası — Online Endüstriyel Mutfak Teklifi
          </h1>
          <p className={styles.srOnly}>
            Proje Fabrikası (PFOS), Equsto&apos;nun kural-motoru tabanlı online
            ekipman teklif sistemidir. Konsept, kapasite ve alan bilgilerinize
            göre ekipman listesi ve fiyat tahmini üretir.
          </p>
          <PfosPublicWizard />
        </div>
        <footer className="footer eq-mfoot" id="eq-shop-footer" />
      </div>
    </>
  );
}
