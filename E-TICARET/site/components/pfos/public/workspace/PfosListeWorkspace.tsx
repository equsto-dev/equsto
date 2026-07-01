"use client";

import dynamic from "next/dynamic";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import type { usePfosListeUpload } from "../usePfosListeUpload";
import {
  buildListeBulkWhatsAppUrl,
} from "@/lib/pfos/teklif/liste-kalem-whatsapp.client";
import { trackPfosListeWhatsApp } from "@/lib/pfos/track-pfos-analytics.client";
import { useFlipCollapse } from "./useFlipCollapse";
import ws from "./pfos-workspace.module.css";
import styles from "../pfos-public.module.css";

const TeklifV14Proforma = dynamic(() => import("@/components/pfos/TeklifV14Proforma"), {
  loading: () => <TeklifProformaLoading />,
  ssr: false,
});

function TeklifProformaLoading() {
  const { t } = usePfosLabel();
  return (
    <p className={ws.teklifLoading} role="status">
      {t("Teklif yükleniyor…")}
    </p>
  );
}

type UploadState = ReturnType<typeof usePfosListeUpload>;

type Props = Pick<
  UploadState,
  | "inputRef"
  | "drag"
  | "setDrag"
  | "file"
  | "loadingKind"
  | "error"
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
  onPick,
  sonuc,
  teklifV14,
  reset,
  largePane = false,
  hideTitle = false,
}: Props & { largePane?: boolean; hideTitle?: boolean }) {
  const { t } = usePfosLabel();
  const compact = !!(file || loadingKind || sonuc);
  const uploadFlipRef = useFlipCollapse(compact);
  const fillDropzone = largePane || hideTitle;

  const fiyatsizKalemler =
    teklifV14?.satirlar
      .filter((s) => s.birimSatis == null)
      .map((s) => ({ poz: s.poz, tanim: s.tanim })) ?? [];
  const fiyatsizSayi = fiyatsizKalemler.length;

  return (
    <div className={ws.listeWorkspace}>
      <div
        ref={uploadFlipRef}
        className={`${ws.uploadCard}${compact ? ` ${ws.uploadCardCompact}` : ""}${largePane && !compact ? ` ${ws.uploadCardLarge}` : ""}`}
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
            {!hideTitle ? (
              <h2 className={ws.uploadTitle}>
                {t("Listeni yükle fiyatlandıralım.")}
              </h2>
            ) : null}
            <div className={fillDropzone ? styles.uploadRailFill : undefined}>
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
            </div>
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
              ✔{" "}
              {sonuc.ozet?.eslesmisZorunluSayisi ?? sonuc.ozet?.eslesmeSayisi ?? 0}
              /{sonuc.kalemler?.length ?? sonuc.ozet?.toplamKalemSayisi ?? 0}{" "}
              {t("fiyatlandı")}
            </span>
            <span className={ws.matchStatSub}>
              {sonuc.kalemler?.length ?? sonuc.ozet?.toplamKalemSayisi ?? 0}{" "}
              {t("kalem listelendi")}
            </span>
            {sonuc.ozet?.toplamFiyat != null ? (
              <span className={ws.matchStatPrice}>
                {formatTry(sonuc.ozet.toplamFiyat)}
              </span>
            ) : null}
            {teklifV14 && fiyatsizSayi > 0 ? (
              <span className={ws.matchStatWarn}>
                ⚠ {fiyatsizSayi} {t("fiyatsız")}
              </span>
            ) : null}
          </div>
          {teklifV14 && fiyatsizSayi > 0 ? (
            <div className={ws.fiyatsizBanner}>
              <p className={ws.fiyatsizBannerText}>
                {fiyatsizSayi}{" "}
                {t(
                  "kalem için katalog fiyatı bulunamadı — satırlar sarı ile işaretlidir.",
                )}
              </p>
              <a
                className={ws.fiyatsizBannerWa}
                href={buildListeBulkWhatsAppUrl({
                  kalemler: fiyatsizKalemler,
                  teklifSayi: teklifV14.ust.sayi,
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackPfosListeWhatsApp({
                    scope: "toplu",
                    fiyatsizSayi,
                    teklifSayi: teklifV14.ust.sayi,
                  })
                }
              >
                {t("Tüm fiyatsız kalemler için WhatsApp")}
              </a>
            </div>
          ) : null}
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
          <TeklifV14Proforma model={teklifV14} deliveryOnly pfosSource="liste" />
        </div>
      ) : null}
    </div>
  );
}
