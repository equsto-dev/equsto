"use client";

import { PFOS_PUBLIC_VERSION } from "@/lib/pfos/public-version";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "./pfos-public.module.css";

/** PFOS sayfası en alt — sürüm ve yapay zeka uyarısı */
export default function PfosVersionBar() {
  const { t } = usePfosLabel();

  return (
    <aside className={styles.versionBar} aria-label={t("PFOS sürüm bilgisi")}>
      <p className={styles.versionBarText}>
        <span className={styles.versionBarVersion}>
          {t("Versiyon")} {PFOS_PUBLIC_VERSION}
        </span>
        <span className={styles.versionBarSep} aria-hidden="true">
          {" | "}
        </span>
        <span className={styles.versionBarDisclaimer}>
          {t("Equsto.com yapay zekadan yardım alır, hata yapabilir.")}{" "}
          <a href="/iletisim" className={styles.versionBarLink}>
            {t("Lütfen iletişime geçin.")}
          </a>
        </span>
      </p>
    </aside>
  );
}
