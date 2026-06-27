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
  /** Sürükle-bırak / tıklama — liste modülüne odaklan */
  onFocusPane?: () => void;
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
  onFocusPane,
}: Props) {
  const { t } = usePfosLabel();

  if (!memberReady) return null;

  const formatNote = (
    <p className={styles.listeFormatNoteRail}>
      {t(
        "Excel: Poz, ürün adı, ölçü ve adet okunur; fiyatlar Equsto katalogundan gelir. PDF: proforma satırları katalog eşlemesi ile fiyatlandırılır.",
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
        {t("Ekipman listenizi yükleyin — katalog eşlemesi ile fiyatlandırılır.")}
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
              if (!loadingKind) {
                onFocusPane?.();
                inputRef.current?.click();
              }
            }}
            onKeyDown={(e) => {
              if (loadingKind) return;
              if (e.key === "Enter" || e.key === " ") {
                onFocusPane?.();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              if (loadingKind) return;
              e.preventDefault();
              onFocusPane?.();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              if (loadingKind) return;
              e.preventDefault();
              setDrag(false);
              onFocusPane?.();
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
                    ? t("PDF okunuyor…")
                    : t("Liste aktarılıyor…")}
                </strong>
                <span className={styles.listeDropHint}>
                  {loadingKind === "pdf"
                    ? t("Birkaç saniye sürebilir")
                    : t("Lütfen bekleyin")}
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
