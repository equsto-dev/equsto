"use client";

import { useState } from "react";
import PfosKonseptEkipmanGrid from "@/components/pfos/PfosKonseptEkipmanGrid";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

export type TeklifKarar = "idle" | "yeterli" | "detaylandir";

type Props = {
  dukkanTuru: string;
  ustSegment?: string;
  onKarar?: (karar: TeklifKarar) => void;
};

export default function PfosTeklifKararBlock({
  dukkanTuru,
  ustSegment = "",
  onKarar,
}: Props) {
  const { t } = usePfosLabel();
  const [karar, setKarar] = useState<TeklifKarar>("idle");

  function pick(next: TeklifKarar) {
    setKarar(next);
    onKarar?.(next);
  }

  return (
    <>
      <div className={styles.teklifKararBox}>
        <p className={styles.teklifKararQuestion}>
          {t(
            "Buraya kadar yeterli mi yoksa projeyi senin için detaylandırayım mı?",
          )}
        </p>
        <div className={styles.teklifKararActions}>
          <button
            type="button"
            className={`${styles.teklifKararBtn}${karar === "yeterli" ? ` ${styles.teklifKararBtnSelected}` : ""}`}
            onClick={() => pick("yeterli")}
          >
            <b>{t("Buraya kadar yeterli")}</b>
            <span>{t("PDF teklifimi e-posta veya WhatsApp ile al")}</span>
          </button>
          <button
            type="button"
            className={`${styles.teklifKararBtn}${karar === "detaylandir" ? ` ${styles.teklifKararBtnSelected}` : ""}`}
            onClick={() => pick("detaylandir")}
          >
            <b>{t("Projeyi detaylandır")}</b>
            <span>{t("Konseptinize uygun yardımcı ekipman vitrini")}</span>
          </button>
        </div>
      </div>
      {karar === "detaylandir" ? (
        <PfosKonseptEkipmanGrid
          dukkanTuru={dukkanTuru}
          ustSegment={ustSegment}
        />
      ) : null}
    </>
  );
}
