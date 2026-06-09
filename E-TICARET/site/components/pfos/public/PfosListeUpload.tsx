"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import { fetchTcmbKurForTeklif } from "@/lib/pfos/teklif/fetch-kur.client";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import TeklifV14Proforma from "@/components/pfos/TeklifV14Proforma";
import PfosTeklifLoading from "./PfosTeklifLoading";
import {
  memberLoggedInNow,
  pfosLoginHref,
  pfosRegisterHref,
} from "@/lib/pfos/member-session.client";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "./pfos-public.module.css";

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function fileKind(file: File): "excel" | "pdf" | null {
  if (/\.xlsx?$/i.test(file.name)) return "excel";
  if (/\.pdf$/i.test(file.name)) return "pdf";
  return null;
}

export default function PfosListeUpload() {
  const { t } = usePfosLabel();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadingKind, setLoadingKind] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [memberReady, setMemberReady] = useState(false);
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");
  const [registerHref, setRegisterHref] = useState("/login?mode=register");

  useEffect(() => {
    const syncMember = () => setMemberLoggedIn(memberLoggedInNow());
    syncMember();
    setLoginHref(pfosLoginHref());
    setRegisterHref(pfosRegisterHref());
    setMemberReady(true);
    document.addEventListener("equsto-member-session", syncMember);
    document.addEventListener("equsto-member-changed", syncMember);
    return () => {
      document.removeEventListener("equsto-member-session", syncMember);
      document.removeEventListener("equsto-member-changed", syncMember);
    };
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setSonuc(null);
    setTeklifV14(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const priceFile = useCallback(async (f: File) => {
    const kind = fileKind(f);
    if (!kind) {
      setError(t("Yalnızca Excel (.xlsx) veya PDF (.pdf) desteklenir."));
      return;
    }

    setFile(f);
    setLoadingKind(kind);
    setError(null);
    setSonuc(null);
    setTeklifV14(null);

    try {
      const form = new FormData();
      form.append("file", f);
      form.append("projeAdi", f.name.replace(/\.xlsx?$/i, ""));

      const res = await fetch("/api/pfos/liste-fiyat", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? t("Liste fiyatlandırılamadı"),
        );
      }

      const pfos = data as PFOSResponse;
      setSonuc(pfos);
      const snap = await fetchTcmbKurForTeklif();
      setTeklifV14(
        pfosResponseToTeklifV14(pfos, {
          projeAdi: pfos.konseptLabel,
          musteri: "",
          teslimatAdresi: pfos.sehir ?? "—",
          bolumM2: {},
          eurTry: snap?.rate ?? null,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Beklenmeyen hata"));
    } finally {
      setLoadingKind(null);
    }
  }, [t]);

  const onPick = useCallback(
    (files: FileList | null | undefined) => {
      const f = files?.[0];
      if (f) void priceFile(f);
    },
    [priceFile],
  );

  if (!memberReady) return null;

  if (!memberLoggedIn) {
    return (
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.memberGate}>
            <h2 className={styles.memberGateTitle}>
              {t("Devam etmek için üye girişi")}
            </h2>
            <p className={styles.memberGateSub}>
              {t(
                "Ekipman listenizi fiyatlandırmak için Equsto hesabınızla giriş yapın.",
              )}
            </p>
            <a href={loginHref} className={styles.memberGateLink}>
              {t("Üye Girişi")}
            </a>
            <p className={styles.memberGateNote}>
              {t("Hesabınız yok mu?")}{" "}
              <a href={registerHref} className={styles.memberGateRegisterLink}>
                {t("Kayıt ol")}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingKind) {
    return (
      <PfosTeklifLoading
        label={
          loadingKind === "pdf"
            ? t("PDF analiz ediliyor ve fiyatlandırılıyor…")
            : t("Liste fiyatlandırılıyor…")
        }
      />
    );
  }

  if (sonuc && teklifV14) {
    return (
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <section className={`${styles.sec} ${styles.secVis} ${styles.secDone}`}>
            <div className={styles.secHd}>
              <span className={styles.secNum}>✓</span>
              <span className={styles.secInfo}>
                <span className={styles.secTitle}>
                  {t("Listeniz fiyatlandırıldı")}
                </span>
                <span className={styles.secSub}>
                  {sonuc.konseptLabel} · {sonuc.kalemler?.length ?? 0}{" "}
                  {t("kalem")} · {sonuc.ozet?.eslesmeSayisi ?? 0}{" "}
                  {t("eşleşme")}
                </span>
                <span className={styles.teklifTotalInline}>
                  {formatTry(sonuc.ozet?.toplamFiyat ?? 0)}{" "}
                  <small>({t("tahmini, KDV hariç")})</small>
                </span>
              </span>
            </div>
            <div className={styles.secBd}>
              {sonuc.uyarilar?.length ? (
                <ul className={styles.listeUyarilar}>
                  {sonuc.uyarilar.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={reset}
              >
                {t("Yeni liste yükle")}
              </button>
            </div>
          </section>
          <div className={styles.proformaWrap}>
            <TeklifV14Proforma model={teklifV14} deliveryOnly />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.leftCol}>
        <p className={styles.mreGreeting}>
          {t("Ekipman listenizi yükleyin — PFOS katalogdan fiyatlasın.")}
        </p>
        <p className={styles.mreMotto}>
          {t("Excel (.xlsx) veya PDF teklif / proforma listesi")}
        </p>

        <div
          className={`${styles.listeDropZone}${drag ? ` ${styles.listeDropZoneDrag}` : ""}${file ? ` ${styles.listeDropZoneHasFile}` : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
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
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.pdf"
            className={styles.listeDropInput}
            onChange={(e) => onPick(e.target.files)}
          />
          <span className={styles.listeDropIcon} aria-hidden>
            📋
          </span>
          {file ? (
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

        {error ? <div className={styles.error}>{error}</div> : null}

        <p className={styles.listeFormatNote}>
          {t(
            "Excel: P.No, ekipman adı, ölçü ve adet sütunları (Equsto referans formatı). PDF: PFOS yapay zeka ile kalemleri okur ve katalogdan fiyatlar (1–2 dakika sürebilir).",
          )}
        </p>
      </div>

      <aside className={styles.rightCol} aria-label={t("Liste yükleme")}>
        <section className={styles.railSection}>
          <span className={styles.railKicker}>{t("Nasıl çalışır?")}</span>
          <span className={styles.railTitle}>{t("Liste → fiyat")}</span>
          <ol className={styles.listeSteps}>
            <li>{t("Excel veya PDF dosyanızı sürükleyin")}</li>
            <li>{t("PFOS her kalemi katalogda eşleştirir")}</li>
            <li>{t("Ön teklif proforması anında oluşur")}</li>
          </ol>
        </section>
        <section className={styles.railSection}>
          <span className={styles.railKicker}>{t("Teklif motoru")}</span>
          <span className={styles.railTitle}>{t("Referans eşleme")}</span>
          <p className={styles.railPlaceholder}>
            {t(
              "Kayıtlı referans listeleriyle aynı katalog politikası — doğrulanmış SKU linkleri ve sıkı isim/ölçü araması.",
            )}
          </p>
        </section>
      </aside>
    </div>
  );
}
