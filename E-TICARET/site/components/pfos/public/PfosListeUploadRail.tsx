"use client";

import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import type { usePfosListeUpload } from "./usePfosListeUpload";
import styles from "./pfos-public.module.css";

type UploadState = ReturnType<typeof usePfosListeUpload>;

type Props = Pick<
  UploadState,
  | "inputRef"
  | "drag"
  | "setDrag"
  | "file"
  | "loadingKind"
  | "error"
  | "memberReady"
  | "memberLoggedIn"
  | "loginHref"
  | "onPick"
> & {
  /** Dropzone altı meslek paneli ile hizalansın */
  fillHeight?: boolean;
};

/** Sağ panel — Excel/PDF liste yükleme */
export default function PfosListeUploadRail({
  inputRef,
  drag,
  setDrag,
  file,
  loadingKind,
  error,
  memberReady,
  memberLoggedIn,
  loginHref,
  onPick,
  fillHeight = false,
}: Props) {
  const { t } = usePfosLabel();

  if (!memberReady) return null;

  const formatNote = (
    <p className={styles.listeFormatNoteRail}>
      {t(
        "Excel: P.No, ekipman adı, ölçü ve adet sütunları (Equsto referans formatı). PDF: PFOS yapay zeka ile kalemleri okur ve katalogdan fiyatlar (1–2 dakika sürebilir).",
      )}
    </p>
  );

  return (
    <>
      <section
        className={`${styles.railSection} ${styles.railSectionUpload}${fillHeight ? ` ${styles.uploadRailFill}` : ""}`}
        aria-label={t("Liste yükleme")}
      >
      <span className={styles.railKicker}>{t("Liste yükleme")}</span>
      <span className={styles.railTitle}>
        {t("Ekipman listenizi yükleyin — PFOS katalogdan fiyatlasın.")}
      </span>
      <p className={styles.railPlaceholder}>
        {t("Excel (.xlsx) veya PDF teklif / proforma listesi")}
      </p>

      {!memberLoggedIn ? (
        <p className={styles.railPlaceholder}>
          {t("Yüklemek için")}{" "}
          <a href={loginHref} className={styles.memberGateRegisterLink}>
            {t("üye girişi")}
          </a>{" "}
          {t("yapın.")}
        </p>
      ) : (
        <>
          <div
            className={`${styles.listeDropZone} ${styles.listeDropZoneRail}${drag ? ` ${styles.listeDropZoneDrag}` : ""}${file ? ` ${styles.listeDropZoneHasFile}` : ""}${loadingKind ? ` ${styles.listeDropZoneBusy}` : ""}`}
            data-pfos-dropzone=""
            role="button"
            tabIndex={loadingKind ? -1 : 0}
            aria-busy={!!loadingKind}
            onClick={() => {
              if (!loadingKind) inputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (loadingKind) return;
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              if (loadingKind) return;
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              if (loadingKind) return;
              e.preventDefault();
              setDrag(false);
              onPick(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.pdf"
              className={styles.listeDropInput}
              disabled={!!loadingKind}
              onChange={(e) => onPick(e.target.files)}
            />
            <span className={styles.listeDropIcon} aria-hidden>
              📋
            </span>
            {loadingKind ? (
              <>
                <strong className={styles.listeDropTitle}>
                  {loadingKind === "pdf"
                    ? t("PDF analiz ediliyor…")
                    : t("Liste fiyatlandırılıyor…")}
                </strong>
                <span className={styles.listeDropHint}>
                  {t("1–2 dakika sürebilir")}
                </span>
              </>
            ) : file ? (
              <>
                <strong className={styles.listeDropTitle}>{file.name}</strong>
                <span className={styles.listeDropHint}>
                  {(file.size / 1024).toFixed(1)} KB ·{" "}
                  {t("Değiştirmek için tıkla veya sürükle")}
                </span>
              </>
            ) : (
              <>
                <strong className={styles.listeDropTitle}>
                  {t("Excel veya PDF listesini sürükle veya tıkla")}
                </strong>
                <span className={styles.listeDropHint}>
                  {t(
                    "Teklif listesi · proforma · müşteri ekipman listesi (.xlsx, .pdf)",
                  )}
                </span>
              </>
            )}
          </div>

          {error ? <div className={styles.railError}>{error}</div> : null}

          {!fillHeight ? formatNote : null}
        </>
      )}
      </section>
      {fillHeight && memberLoggedIn ? formatNote : null}
    </>
  );
}
