"use client";

import TeklifV14Proforma from "@/components/pfos/TeklifV14Proforma";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import type { usePfosListeUpload } from "../usePfosListeUpload";
import { useFlipCollapse } from "./useFlipCollapse";
import ws from "./pfos-workspace.module.css";
import styles from "../pfos-public.module.css";

type UploadState = ReturnType<typeof usePfosListeUpload>;

type Props = Pick<
  UploadState,
  | "inputRef"
  | "drag"
  | "setDrag"
  | "file"
  | "loadingKind"
  | "error"
  | "memberLoggedIn"
  | "loginHref"
  | "onPick"
  | "sonuc"
  | "teklifV14"
  | "reset"
>;

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PfosListeWorkspace({
  inputRef,
  drag,
  setDrag,
  file,
  loadingKind,
  error,
  memberLoggedIn,
  loginHref,
  onPick,
  sonuc,
  teklifV14,
  reset,
}: Props) {
  const { t } = usePfosLabel();
  const compact = !!(file || loadingKind || sonuc);
  const uploadFlipRef = useFlipCollapse(compact);

  return (
    <div className={ws.listeWorkspace}>
      <div
        ref={uploadFlipRef}
        className={`${ws.uploadCard}${compact ? ` ${ws.uploadCardCompact}` : ""}`}
      >
        {compact ? (
          <div className={ws.uploadCompactRow}>
            <span className={ws.uploadCompactIcon} aria-hidden>
              ▤
            </span>
            <div className={ws.uploadCompactMeta}>
              <strong>{file?.name ?? t("Liste")}</strong>
              <span>
                {loadingKind
                  ? t("Eşleştiriliyor…")
                  : sonuc
                    ? `${sonuc.kalemler?.length ?? 0} ${t("kalem")}`
                    : t("Hazır")}
              </span>
            </div>
            {!loadingKind ? (
              <button
                type="button"
                className={ws.uploadCompactChange}
                onClick={() => inputRef.current?.click()}
              >
                {t("Değiştir")}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <h2 className={ws.uploadTitle}>
              {t("Ekipman listenizi yükleyin")}
            </h2>
            <p className={ws.uploadSub}>
              {t("Excel veya PDF — katalog eşlemesi ile fiyatlandırılır")}
            </p>
            {!memberLoggedIn ? (
              <p className={ws.uploadLogin}>
                {t("Yüklemek için")}{" "}
                <a href={loginHref}>{t("üye girişi")}</a>
              </p>
            ) : (
              <div
                className={`${styles.listeDropZone} ${styles.listeDropZoneRail}${drag ? ` ${styles.listeDropZoneDrag}` : ""}${loadingKind ? ` ${styles.listeDropZoneBusy}` : ""}`}
                data-pfos-dropzone=""
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  onPick(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className={styles.listeDropIcon} aria-hidden>
                  📋
                </span>
                <span className={styles.listeDropTitle}>
                  {t("Excel veya PDF sürükle veya tıkla")}
                </span>
                <span className={styles.listeDropHint}>.xlsx · .pdf</span>
              </div>
            )}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.pdf,application/pdf"
          className={styles.listeDropInput}
          onChange={(e) => onPick(e.target.files)}
        />
        {error ? <p className={ws.uploadError}>{error}</p> : null}
      </div>

      {loadingKind ? (
        <section className={`${ws.matchCard} ${ws.motionEnter}`}>
          <h3 className={ws.matchCardTitle}>{t("Katalog eşleşmesi")}</h3>
          <p className={ws.matchCardSub}>{t("Liste aktarılıyor… Lütfen bekleyin")}</p>
          <div className={ws.matchSkeleton}>
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : null}

      {sonuc && !loadingKind ? (
        <section className={`${ws.matchCard} ${ws.motionEnter}`}>
          <header className={ws.matchCardHead}>
            <div>
              <h3 className={ws.matchCardTitle}>{t("Katalog eşleşmesi")}</h3>
              <p className={ws.matchCardSub}>
                {sonuc.konseptLabel} · {sonuc.kalemler?.length ?? 0}{" "}
                {t("kalem")}
              </p>
            </div>
            <button type="button" className={ws.matchReset} onClick={reset}>
              {t("Yeni liste")}
            </button>
          </header>
          <div className={ws.matchStats}>
            <span className={ws.matchStatOk}>
              ✔ {sonuc.ozet?.eslesmisZorunluSayisi ?? sonuc.ozet?.eslesmeSayisi ?? 0}{" "}
              {t("eşleşti")}
            </span>
            {sonuc.ozet?.toplamFiyat != null ? (
              <span className={ws.matchStatPrice}>
                {formatTry(sonuc.ozet.toplamFiyat)}
              </span>
            ) : null}
          </div>
          {sonuc.uyarilar?.length ? (
            <ul className={styles.listeUyarilar}>
              {sonuc.uyarilar.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {teklifV14 ? (
        <div className={`${ws.teklifStage} ${ws.motionEnter}`}>
          <TeklifV14Proforma model={teklifV14} deliveryOnly />
        </div>
      ) : null}
    </div>
  );
}
