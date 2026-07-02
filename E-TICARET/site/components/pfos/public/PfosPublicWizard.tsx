"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Konsept, PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import { KonseptEnum } from "@/lib/pfos/schemas/pfos.schema";
import {
  dukkanSecimdenMotorSlug,
  soruCevaplarindanMotorGirdi,
  type SoruCevapHaritasi,
} from "@/lib/pfos/proje-akis/soru-motor-mapping";
import {
  kucukAlanSegmentM2Aktif,
  otelSegmentM2Aktif,
  PFOS_Q_UST_SEGMENT,
  ustSegmentOptionsForM2,
} from "@/lib/pfos/proje-akis/wizard-questions";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import { fetchTcmbKurForTeklif } from "@/lib/pfos/teklif/fetch-kur.client";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";

const TeklifV14Proforma = dynamic(() => import("@/components/pfos/TeklifV14Proforma"), {
  ssr: false,
});
import {
  clearDownstreamAnswers,
  isLegacyPanelComplete,
  isM2AnswerValid,
  orderedLegacyPanels,
  panelAnswerSummary,
  panelQuestions,
  wizardHint,
  type LegacyPanelDef,
} from "@/lib/pfos/wizard/legacy-panels";
import {
  adresFormToAnswers,
  answersToAdresForm,
  loadTrAdres,
} from "@/lib/pfos/adres/tr-adres";
import PfosAdresAutocomplete from "./PfosAdresAutocomplete";
import PfosTeklifLoading from "./PfosTeklifLoading";
import { usePfosListeUpload } from "./usePfosListeUpload";
import PfosWorkspaceShell from "./workspace/PfosWorkspaceShell";
import PfosListeWorkspace from "./workspace/PfosListeWorkspace";
import ws from "./workspace/pfos-workspace.module.css";
import {
  deriveListePipelineStage,
  deriveWizardPipelineStage,
} from "./workspace/derive-pipeline-stage";
import {
  LISTE_PIPELINE,
  WIZARD_PIPELINE,
  summaryFromPfos,
  type LiveSummaryData,
} from "./workspace/pfos-workspace.types";
import {
  defaultPublicQuestions,
  dukkanSecenekleri,
  mergePublicWizardQuestions,
  type WizardQuestion,
} from "@/lib/pfos/wizard/public-flow";
import {
  bulutDukkanGecerliMi,
  bulutMutfakKompaktMi,
  BULUT_KOMPAKT_M2_MAX,
} from "@/lib/pfos/wizard/bulut-mutfak-kompakt";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import { logPfosQuoteGenerated } from "@/lib/pfos/log-pfos-usage.client";
import { readFetchJson } from "@/lib/pfos/fetch-json.client";
import styles from "./pfos-public.module.css";

type ShopTypeRow = {
  pfos?: {
    motorSlug?: string;
    dukkanSecim?: string;
    m2Min?: number;
    m2Max?: number;
  };
};

type Props = {
  initialQuestions?: WizardQuestion[];
};

const M2_PRESETS = [40, 80, 120, 200, 350, 500, 750, 1000];

function formatM2Preset(n: number) {
  return `${n.toLocaleString("tr-TR")} m²`;
}

/** Panel geçiş süreleri (CSS transition ile eşleşmeli) */
const PFOS_PANEL_FADE_MS = 580;
const PFOS_PANEL_REVEAL_DELAY_MS = 120;
const PFOS_RESULT_FADE_MS = 580;

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function parseKonsept(slug: string | null): string | null {
  if (!slug) return null;
  const normalized = String(slug).trim();
  return normalized.length > 0 ? normalized : null;
}

export default function PfosPublicWizard({ initialQuestions }: Props) {
  const { t } = usePfosLabel();
  const listeUpload = usePfosListeUpload();
  const [questions, setQuestions] = useState<WizardQuestion[]>(
    initialQuestions ?? defaultPublicQuestions(),
  );
  const [shopTypes, setShopTypes] = useState<ShopTypeRow[]>([]);
  const [answers, setAnswers] = useState<SoruCevapHaritasi>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [finished, setFinished] = useState(false);
  const [animatingPanelId, setAnimatingPanelId] = useState<string | null>(null);
  const [animatingPanelReveal, setAnimatingPanelReveal] = useState(false);
  const [resultEntering, setResultEntering] = useState(false);
  const [resultReveal, setResultReveal] = useState(false);
  const [m2Touched, setM2Touched] = useState(false);
  const [adresListOpen, setAdresListOpen] = useState(false);
  const prevOpenPanelIdRef = useRef("s1");
  const teklifRequestedRef = useRef(false);
  const enterTimerRef = useRef<number | null>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [activePane, setActivePane] = useState<"balanced" | "wizard" | "liste">(
    "balanced",
  );

  const wizardPaneCollapsed = activePane === "liste";
  const listePaneCollapsed = activePane === "wizard";

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current != null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadTrAdres();
    void (async () => {
      const { fetchProjeAkis } = await import("@/lib/pro-admin-client");
      const { data } = await fetchProjeAkis();
      if (cancelled || !data) return;
      if (Array.isArray(data.questions) && data.questions.length) {
        setQuestions(
          mergePublicWizardQuestions(data.questions as WizardQuestion[]),
        );
      }
      if (Array.isArray(data.shopTypes)) {
        setShopTypes(data.shopTypes as ShopTypeRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const panels = useMemo(
    () => orderedLegacyPanels(questions, answers),
    [questions, answers],
  );

  const wizardListeMode = !!(listeUpload.sonuc && listeUpload.teklifV14);
  const wizardHasProforma = !!(finished && sonuc && teklifV14);
  const listeHasContent = !!(
    listeUpload.file ||
    listeUpload.loadingKind ||
    listeUpload.sonuc
  );

  useEffect(() => {
    if (wizardListeMode) setActivePane("liste");
  }, [wizardListeMode]);

  useEffect(() => {
    if (listeUpload.loadingKind) setActivePane("liste");
  }, [listeUpload.loadingKind]);

  useEffect(() => {
    if (wizardHasProforma && !wizardListeMode) setActivePane("wizard");
  }, [wizardHasProforma, wizardListeMode]);

  const resetListeUpload = useCallback(() => {
    listeUpload.reset();
    setActivePane(wizardHasProforma ? "wizard" : "balanced");
  }, [listeUpload, wizardHasProforma]);

  const focusWizardPane = useCallback(() => {
    setActivePane("wizard");
  }, []);

  const engageWizardPane = useCallback(() => {
    setActivePane((p) => (p === "wizard" ? p : "wizard"));
  }, []);

  const engageListePane = useCallback(() => {
    setActivePane((p) => (p === "liste" ? p : "liste"));
  }, []);

  const openPanelIndex = useMemo(() => {
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      if (panel.id === "s5") {
        if (!m2Touched || !isM2AnswerValid(answers)) return i;
        continue;
      }
      if (!isLegacyPanelComplete(panel, questions, answers)) return i;
    }
    return Math.max(0, panels.length - 1);
  }, [panels, questions, answers, m2Touched]);

  const allWizardComplete = useMemo(
    () =>
      panels.length > 0 &&
      panels.every((p) => isLegacyPanelComplete(p, questions, answers)),
    [panels, questions, answers],
  );

  /* KİLİT: public/pfos-liste-upload-rail-KILIT.txt — pfos-progress id korunur */
  const openPanelId = panels[openPanelIndex]?.id ?? "s1";

  useEffect(() => {
    setAdresListOpen(false);
  }, [openPanelIndex]);

  useEffect(() => {
    if (openPanelId === "s5" && prevOpenPanelIdRef.current !== "s5") {
      setM2Touched(false);
    }
    prevOpenPanelIdRef.current = openPanelId;
  }, [openPanelId]);

  const donePanelIds = useMemo(
    () => new Set(panels.slice(0, openPanelIndex).map((p) => p.id)),
    [panels, openPanelIndex],
  );

  const openPanelIndexRef = useRef(-1);

  const scheduleReveal = useCallback(
    (setReveal: (v: boolean) => void, delayMs = PFOS_PANEL_REVEAL_DELAY_MS) => {
      setReveal(false);
      let raf2 = 0;
      let delayTimer = 0;
      const start = () => {
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setReveal(true));
        });
        return raf1;
      };
      let raf1 = 0;
      if (delayMs > 0) {
        delayTimer = window.setTimeout(() => {
          raf1 = start();
        }, delayMs);
      } else {
        raf1 = start();
      }
      return () => {
        window.clearTimeout(delayTimer);
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    },
    [],
  );

  useLayoutEffect(() => {
    clearEnterTimer();

    let panelId: string | null = null;
    if (openPanelIndex > openPanelIndexRef.current) {
      panelId = panels[openPanelIndex]?.id ?? null;
    }
    openPanelIndexRef.current = openPanelIndex;

    if (!panelId) return;

    setAnimatingPanelReveal(false);
    setAnimatingPanelId(panelId);
    enterTimerRef.current = window.setTimeout(() => {
      setAnimatingPanelId(null);
      setAnimatingPanelReveal(false);
    }, PFOS_PANEL_FADE_MS + PFOS_PANEL_REVEAL_DELAY_MS + 80);

    return clearEnterTimer;
  }, [openPanelIndex, panels, clearEnterTimer]);

  useLayoutEffect(() => {
    if (!animatingPanelId) return;
    return scheduleReveal(setAnimatingPanelReveal);
  }, [animatingPanelId, scheduleReveal]);

  useLayoutEffect(() => {
    if (!(finished && sonuc && teklifV14)) {
      setResultEntering(false);
      setResultReveal(false);
      return;
    }
    setResultEntering(true);
    setResultReveal(false);
    const cleanup = scheduleReveal(setResultReveal);
    const t = window.setTimeout(() => {
      setResultEntering(false);
      setResultReveal(false);
    }, PFOS_RESULT_FADE_MS + 80);
    return () => {
      cleanup();
      window.clearTimeout(t);
    };
  }, [finished, sonuc, teklifV14, scheduleReveal]);

  const motorGirdi = useMemo(
    () => soruCevaplarindanMotorGirdi(answers),
    [answers],
  );
  const m2ByDukkan = useMemo(() => {
    const out: Record<string, { min: number; max: number }> = {};
    for (const t of shopTypes) {
      const pf = t.pfos;
      if (!pf) continue;
      const sel = pf.dukkanSecim?.trim();
      if (!sel) continue;
      const min = Number(pf.m2Min) || 0;
      const max = Number(pf.m2Max) || 0;
      if (min > 0 || max > 0) {
        out[sel] = { min: min || 20, max: max || 10000 };
      }
    }
    if (out.Restoran && !out["Büyük Restoran"]) {
      out["Büyük Restoran"] = out.Restoran;
    }
    return out;
  }, [shopTypes]);
  const motorSlug = useMemo(
    () => dukkanSecimdenMotorSlug(motorGirdi.dukkanSecim, shopTypes),
    [motorGirdi.dukkanSecim, shopTypes],
  );
  const konsept = parseKonsept(motorSlug ?? motorGirdi.dukkanSecim);

  const hint = useMemo(() => {
    const h = wizardHint(panels, donePanelIds, openPanelId);
    return { pct: h.pct, title: t(h.title), sub: t(h.sub) };
  }, [panels, donePanelIds, openPanelId, t]);

  const liveSummary = useMemo((): LiveSummaryData => {
    if (listeUpload.sonuc) {
      return summaryFromPfos(
        listeUpload.sonuc,
        listeUpload.file?.name?.replace(/\.xlsx?$/i, "") ?? undefined,
      );
    }
    if (sonuc && finished) {
      return summaryFromPfos(sonuc, sonuc.konseptLabel);
    }
    const dukkan = String(answers.q_dukkan_turu ?? "").trim();
    return {
      projeAdi: dukkan ? t(dukkan) : t("Yeni mutfak projesi"),
      urunSayisi: 0,
      markaSayisi: 0,
      kategoriSayisi: 0,
      tahminiFiyat: null,
      doviz: "TRY",
      eslesen: 0,
      bekleyen: 0,
      toplamZorunlu: 0,
      guvenSkoru: null,
      wizardPct: hint.pct,
    };
  }, [
    listeUpload.sonuc,
    listeUpload.file,
    sonuc,
    finished,
    answers.q_dukkan_turu,
    hint.pct,
    t,
  ]);

  const pipelineSteps =
    activePane === "liste" || wizardListeMode ? LISTE_PIPELINE : WIZARD_PIPELINE;
  const pipelineActive =
    activePane === "liste" || wizardListeMode
      ? deriveListePipelineStage(listeUpload)
      : deriveWizardPipelineStage({
          openPanelId,
          finished,
          loading,
          hasTeklif: !!(teklifV14 || listeUpload.teklifV14),
        });

  const panelVisible = useCallback(
    (_panel: LegacyPanelDef, index: number) => index <= openPanelIndex,
    [openPanelIndex],
  );

  const reopenPanel = useCallback(
    (panelId: string) => {
      const idx = panels.findIndex((p) => p.id === panelId);
      if (idx < 0) return;
      setFinished(false);
      setSonuc(null);
      setTeklifV14(null);
      setAnswers((prev) => {
        const next = { ...prev };
        for (let i = idx; i < panels.length; i++) {
          for (const qid of panels[i].questionIds) {
            delete next[qid as keyof SoruCevapHaritasi];
          }
        }
        return next;
      });
    },
    [panels],
  );

  const setM2Value = useCallback((value: string) => {
    setM2Touched(true);
    teklifRequestedRef.current = false;
    setAnswers((prev) => {
      let merged = clearDownstreamAnswers({ ...prev, q_m2: value }, "q_m2");
      const m2 = Number(value);
      const seg = String(merged.q_ust_segment ?? "").trim();
      if (
        seg &&
        Number.isFinite(m2) &&
        !ustSegmentOptionsForM2(PFOS_Q_UST_SEGMENT, m2).includes(seg)
      ) {
        merged = clearDownstreamAnswers(merged, "q_ust_segment");
        delete merged.q_ust_segment;
      }
      if (!bulutDukkanGecerliMi(String(merged.q_dukkan_turu ?? ""), merged)) {
        merged = { ...merged, q_dukkan_turu: "" };
      }
      return merged;
    });
    setError(null);
    setFinished(false);
    setSonuc(null);
    setTeklifV14(null);
  }, []);

  const setAnswer = useCallback(
    (
      id: keyof SoruCevapHaritasi,
      value: string | string[],
      _panel?: LegacyPanelDef,
    ) => {
      teklifRequestedRef.current = false;
      setAnswers((prev) => {
        let merged = clearDownstreamAnswers({ ...prev, [id]: value }, id);
        if (
          id === "q_m2" &&
          !bulutDukkanGecerliMi(String(merged.q_dukkan_turu ?? ""), merged)
        ) {
          merged = { ...merged, q_dukkan_turu: "" };
        }
        return merged;
      });
      setError(null);
      setFinished(false);
      setSonuc(null);
      setTeklifV14(null);
    },
    [],
  );

  const toggleMulti = (opt: string, panel?: LegacyPanelDef) => {
    const cur = answers.q_ne_pisireceksin;
    const arr = Array.isArray(cur) ? [...cur] : cur ? [String(cur)] : [];
    const i = arr.indexOf(opt);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(opt);
    setAnswers((prev) =>
      clearDownstreamAnswers(
        { ...prev, q_ne_pisireceksin: arr },
        "q_ne_pisireceksin",
      ),
    );
    setFinished(false);
    setSonuc(null);
    setTeklifV14(null);
  };

  async function finalize() {
    if (!konsept) {
      setError(
        motorGirdi.dukkanSecim
          ? `"${t(motorGirdi.dukkanSecim)}" ${t("için teklif motoru henüz bağlı değil.")}`
          : t("Dükkan türü seçilmedi."),
      );
      return;
    }

    const m2 = motorGirdi.m2;
    if (m2 < 20) {
      setError(t("Toplam alan en az 20 m² olmalı."));
      return;
    }
    if (
      motorGirdi.dukkanSecim === "Balık Restaurant" &&
      !motorGirdi.altTip?.trim()
    ) {
      setError(
        t("Balık işletme modeli seçin (mahalle balıkçısı, restoran veya lokanta)."),
      );
      return;
    }
    if (
      motorGirdi.dukkanSecim === "Türk / Esnaf lokanta" &&
      !motorGirdi.altTip?.trim()
    ) {
      setError(
        t("Restoran alt tipi seçin (self servis, food court veya masaya servis)."),
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sehir = motorGirdi.lokasyon || "İstanbul";
      const res = await fetch("/api/pfos/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konsept,
          dukkanSecim: motorGirdi.dukkanSecim,
          m2,
          sehir,
          fiyatStratejisi: TEKLIF_DEFAULT_FIYAT_STRATEJISI,
          altTip: motorGirdi.altTip,
          teslimatAdresi: [motorGirdi.lokasyon, motorGirdi.adresNot]
            .filter(Boolean)
            .join(" · "),
          projeAdi: `${motorGirdi.dukkanSecim}${m2 ? ` · ${m2} m²` : ""}`,
        }),
      });
      const data = await readFetchJson<PFOSResponse>(
        res,
        t(
          "Teklif yanıtı boş geldi. Hesaplama uzun sürebilir; lütfen birkaç saniye bekleyip tekrar deneyin.",
        ),
        t("Teklif yanıtı okunamadı. Lütfen tekrar deneyin."),
      );
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? t("Teklif oluşturulamadı"),
        );
      }
      setSonuc(data as PFOSResponse);
      const snap = await fetchTcmbKurForTeklif();
      const v14 = pfosResponseToTeklifV14(data as PFOSResponse, {
        projeAdi: `${motorGirdi.dukkanSecim}${m2 ? ` · ${m2} m²` : ""}`,
        musteri: motorGirdi.franchiseMarka ?? "",
        teslimatAdresi:
          [motorGirdi.lokasyon, motorGirdi.adresNot].filter(Boolean).join(" · ") ||
          "—",
        bolumM2: (data as PFOSResponse).bolumM2 ?? {},
        eurTry: snap?.rate ?? null,
      });
      setTeklifV14(v14);
      logPfosQuoteGenerated(v14, "wizard");
      setFinished(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Beklenmeyen hata"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      !allWizardComplete ||
      teklifV14 ||
      loading ||
      teklifRequestedRef.current
    ) {
      return;
    }
    teklifRequestedRef.current = true;
    void finalize();
  }, [allWizardComplete, teklifV14, loading]);

  function resetWizard() {
    setAnswers({});
    setM2Touched(false);
    teklifRequestedRef.current = false;
    prevOpenPanelIdRef.current = "s1";
    openPanelIndexRef.current = -1;
    clearEnterTimer();
    setAnimatingPanelId(null);
    setAnimatingPanelReveal(false);
    setFinished(false);
    setSonuc(null);
    setTeklifV14(null);
    setError(null);
  }

  function renderM2Field(panel: LegacyPanelDef) {
    const hasM2 = isM2AnswerValid(answers);
    const raw = hasM2 ? Number(answers.q_m2) : NaN;
    const val = Number.isFinite(raw) ? raw : null;
    const bulutSeg =
      String(answers.q_ust_segment ?? "").trim() === "Bulut Mutfak";
    const minM2 = bulutSeg ? 8 : 20;
    const inputDisplay =
      m2Touched && answers.q_m2 != null && String(answers.q_m2).trim() !== ""
        ? String(answers.q_m2)
        : "";
    return (
      <div className={styles.alanField}>
        {!m2Touched ? (
          <p className={styles.alanHint} style={{ marginBottom: 10 }}>
            {t(
              "Dükkan veya mutfağın toplam metrekare tahmini. Emin değilseniz kabaca yazın; sonra düzeltebilirsiniz.",
            )}
          </p>
        ) : null}
        {bulutSeg ? (
          <p className={styles.alanHint} style={{ marginBottom: 10 }}>
            {t(
              `Bulut mutfak: ${BULUT_KOMPAKT_M2_MAX} m² ve altında yalnızca Grab&Go ve Coffee Counter konseptleri açılır.`,
            )}
          </p>
        ) : null}
        {val != null && kucukAlanSegmentM2Aktif(val) ? (
          <p className={styles.alanHint} style={{ marginBottom: 10 }}>
            {t(
              "40 / 80 m²: Kafe, Fast Food, Bar ve Bulut Mutfak segmentleri listelenir.",
            )}
          </p>
        ) : null}
        {val != null && otelSegmentM2Aktif(val) ? (
          <p className={styles.alanHint} style={{ marginBottom: 10 }}>
            {t(
              "750 / 1000 m²: Otel F&B segmenti ve tüm otel referans listeleri kullanılabilir.",
            )}
          </p>
        ) : null}
        <div className={styles.alanHero}>
          <input
            type="number"
            className={styles.alanInput}
            min={minM2}
            max={10000}
            value={inputDisplay}
            placeholder={t("ör. 80")}
            onChange={(e) => setM2Value(e.target.value)}
          />
          <span className={styles.alanUnit}>m²</span>
        </div>
        <div className={styles.alanPresets} role="group">
          {M2_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.presetBtn}${val === n ? ` ${styles.presetBtnActive}` : ""}`}
              onClick={() => setM2Value(String(n))}
            >
              {formatM2Preset(n)}
            </button>
          ))}
        </div>
        {process.env.NODE_ENV !== "production" && motorGirdi.dukkanSecim ? (
          <p className={styles.alanHint}>
            {motorSlug ? `Motor: ${motorSlug}` : "Motor henüz bağlı değil"}
          </p>
        ) : null}
      </div>
    );
  }

  function renderQuestion(q: WizardQuestion, panel: LegacyPanelDef) {
    const id = q.id as keyof SoruCevapHaritasi;

    if (q.id === "q_m2") return renderM2Field(panel);

    if (q.type === "select" || q.type === "select_conditional") {
      const rawOpts =
        q.type === "select_conditional"
          ? dukkanSecenekleri(q, answers, m2ByDukkan)
          : q.id === "q_ust_segment"
            ? ustSegmentOptionsForM2(
                (q.options as string[]) ?? [],
                Number(answers.q_m2),
              )
            : ((q.options as string[]) ?? []);
      const opts = rawOpts.filter((o) => o !== "Bilmiyorum");
      const val = String(answers[id] ?? "");
      const twoCol = opts.length >= 3;
      const bulutKompakt =
        q.id === "q_dukkan_turu" && bulutMutfakKompaktMi(answers);
      const kucukAlanKonsept =
        q.id === "q_ust_segment" &&
        kucukAlanSegmentM2Aktif(Number(answers.q_m2));
      return (
        <>
          {kucukAlanKonsept ? (
            <p className={styles.alanHint} style={{ marginBottom: 8 }}>
              {t(
                "40 / 80 m² seçiminde yalnızca Kafe, Fast Food, Bar ve Bulut Mutfak gösterilir.",
              )}
            </p>
          ) : null}
          {bulutKompakt ? (
            <p className={styles.alanHint} style={{ marginBottom: 8 }}>
              {t(
                `Alan ${BULUT_KOMPAKT_M2_MAX} m² altı — kompakt konsept listesi gösteriliyor.`,
              )}
            </p>
          ) : null}
          <div
            className={`${styles.options}${twoCol ? ` ${styles.twoCol}` : ""}${panel.id === "s3" ? ` ${styles.konseptGrid}` : ""}`}
          >
            {opts.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${styles.optionBtn}${val === opt ? ` ${styles.optionBtnSelected}` : ""}`}
                onClick={() => setAnswer(id, opt, panel)}
              >
                {t(opt)}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (q.type === "multi_select") {
      const selected = Array.isArray(answers[id])
        ? (answers[id] as string[])
        : [];
      return (
        <>
          <div className={styles.multiGrid}>
            {((q.options as string[]) ?? [])
              .filter((o) => o !== "Bilmiyorum")
              .map((opt, i) => (
              <label
                key={opt}
                className={`${styles.multiLabel}${selected.includes(opt) ? ` ${styles.multiLabelSelected}` : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleMulti(opt, panel)}
                />
                {t(opt)}
              </label>
            ))}
          </div>
        </>
      );
    }

    if (q.id === "q_lokasyon") {
      const adresForm = answersToAdresForm(answers);
      return (
        <PfosAdresAutocomplete
          value={adresForm}
          onListOpenChange={setAdresListOpen}
          onChange={(v) => {
            const mapped = adresFormToAnswers(v);
            setAnswers((prev) =>
              clearDownstreamAnswers(
                {
                  ...prev,
                  q_lokasyon: mapped.q_lokasyon,
                  q_acik_adres: mapped.q_acik_adres,
                },
                "q_lokasyon",
              ),
            );
            setFinished(false);
            setSonuc(null);
            setTeklifV14(null);
            setError(null);
          }}
        />
      );
    }

    return (
      <input
        className={styles.textInput}
        type="text"
        value={answers[id] != null ? String(answers[id]) : ""}
        onChange={(e) => setAnswer(id, e.target.value, panel)}
        placeholder={t("Marka adı…")}
      />
    );
  }

  function renderPanel(panel: LegacyPanelDef, index: number) {
    if (!panelVisible(panel, index)) return null;
    const qs = panelQuestions(panel, questions, answers);
    if (qs.length === 0 && panel.skipIfEmpty) return null;

    const isDone = index < openPanelIndex;
    const isActive = index === openPanelIndex;
    const panelAdvancing =
      isActive && openPanelIndex > openPanelIndexRef.current;
    const panelEntering = animatingPanelId === panel.id || panelAdvancing;
    const panelRevealing = panelEntering && animatingPanelReveal;
    const showBody = isDone || isActive;
    const summary = panelAnswerSummary(panel, answers);
    const summaryDisplay = summary
      ? summary
          .split(/[,·]/)
          .map((part) => t(part.trim()))
          .join(summary.includes("·") ? " · " : ", ")
      : "";

    return (
      <section
        key={panel.id}
        id={`pfos-sec-${panel.id}`}
        className={`${styles.sec} ${styles.secVis}${isDone ? ` ${styles.secDone}` : ""}${isActive ? ` ${styles.secActive}` : ""}${isDone ? ` ${styles.secKeepOpen}` : ""}${isActive && adresListOpen && qs.some((q) => q.id === "q_lokasyon") ? ` ${styles.secAdresExpanded}` : ""}${panelEntering ? ` ${styles.secPending}` : ""}${panelRevealing ? ` ${styles.secReveal}` : ""}`}
      >
        <button
          type="button"
          className={styles.secHd}
          onClick={() => {
            focusWizardPane();
            if (isDone) reopenPanel(panel.id);
          }}
        >
          <span className={styles.secNum}>{isDone ? "✓" : panel.num}</span>
          <span className={styles.secInfo}>
            <span className={styles.secTitle}>{t(panel.title)}</span>
            {isActive && panel.sub ? (
              <span className={styles.secSub}>{t(panel.sub)}</span>
            ) : null}
            {summaryDisplay && isDone && !isActive ? (
              <span className={styles.secAns}>{summaryDisplay}</span>
            ) : null}
          </span>
        </button>
        {showBody ? (
          <div className={styles.secBd}>
            {qs.map((q) => (
              <div key={q.id}>
                {q.id !== "q_m2" &&
                q.id !== "q_lokasyon" &&
                q.id !== "q_karar" ? (
                  <>
                    {q.text ? (
                      <h3 className={styles.qInlineTitle}>{t(String(q.text))}</h3>
                    ) : null}
                    {q.note ? (
                      <p className={styles.questionNote}>{t(String(q.note))}</p>
                    ) : null}
                  </>
                ) : null}
                {renderQuestion(q, panel)}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  function renderWizardIntroExtra() {
    return (
      <div className={ws.wizardIntroExtra}>
        <p className={ws.wizardIntroSub}>
          {t("Ben Gastronomi Mekan Tasarımcısı Mr. Equsto. Hoş geldin.")}
        </p>
        <p className={ws.wizardIntroSparkle} aria-live="polite">
          <span className={ws.wizardIntroSparkleText}>
            {t("Beş dakikada yapılır, hemen teslim edilir.")}
          </span>
        </p>
      </div>
    );
  }

  function renderWizardIntro() {
    return (
      <header className={ws.wizardIntro}>
        <h2 className={ws.wizardIntroTitle}>
          {t("Konsept Sihirbazı")}
        </h2>
        {renderWizardIntroExtra()}
      </header>
    );
  }

  function renderWizardCenter(opts?: {
    hideIntro?: boolean;
    introExtraOnly?: boolean;
  }) {
    return (
      <div className={ws.wizardWorkspace}>
        {opts?.introExtraOnly ? renderWizardIntroExtra() : null}
        {!opts?.hideIntro && !opts?.introExtraOnly ? renderWizardIntro() : null}

        <div id="pfos-progress" className={styles.pfProgress}>
          <div className={styles.pfProgressTrack}>
            <div
              className={styles.pfProgressFill}
              style={{ width: `${hint.pct}%` }}
            />
          </div>
          <div className={styles.pfStepHint}>
            <b>{hint.title}</b>
            <small>{hint.sub}</small>
          </div>
        </div>

        <div id="secs" className={ws.wizardSteps}>
          {panels.map(renderPanel)}
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        {loading && allWizardComplete && !teklifV14 ? (
          <PfosTeklifLoading label={t("Teklif hesaplanıyor…")} />
        ) : null}

        {finished && sonuc && teklifV14 ? (
          <>
            <section
              className={`${styles.sec} ${styles.secVis} ${styles.secDone}${resultEntering ? ` ${styles.secPending}` : ""}${resultReveal ? ` ${styles.secReveal}` : ""}`}
            >
              <div className={styles.secHd}>
                <span className={styles.secNum}>✓</span>
                <span className={styles.secInfo}>
                  <span className={styles.secTitle}>
                    {t("Listen hazır")}
                  </span>
                  <span className={styles.secSub}>
                    {sonuc.konseptLabel} · {motorGirdi.m2} m² ·{" "}
                    {sonuc.kalemler?.length ?? 0} {t("kalem")}
                  </span>
                  <span className={styles.teklifTotalInline}>
                    {formatTry(sonuc.ozet?.toplamFiyat ?? 0)}{" "}
                    <small>({t("KDV hariç")})</small>
                  </span>
                </span>
              </div>
            </section>
            <div
              className={`${styles.proformaWrap}${resultEntering ? ` ${styles.secPending}` : ""}${resultReveal ? ` ${styles.secReveal}` : ""}`}
            >
              <TeklifV14Proforma
                model={teklifV14}
                deliveryOnly
                projeEkipman={{
                  dukkanTuru: String(answers.q_dukkan_turu ?? ""),
                  ustSegment: String(answers.q_ust_segment ?? ""),
                  konseptLabel: sonuc.konseptLabel ?? "",
                  mevcutTipKodlari: (sonuc.kalemler ?? [])
                    .map((k) => k.urunTipi)
                    .filter((t): t is string => Boolean(String(t ?? "").trim())),
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  function renderListePane() {
    const listeWide = activePane === "liste";
    const listeBalanced = activePane === "balanced";
    return (
      <aside
        className={[
          styles.rightCol,
          listePaneCollapsed ? styles.paneCollapsed : "",
          activePane === "liste" ? styles.paneExpanded : "",
          listeWide ? ws.listePaneWide : "",
          listeBalanced ? ws.listePaneBalanced : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={t("Liste yükleme")}
      >
        <div
          className={styles.paneBody}
          onPointerDown={
            activePane !== "liste" ? engageListePane : undefined
          }
        >
          <PfosListeWorkspace
            inputRef={listeUpload.inputRef}
            drag={listeUpload.drag}
            setDrag={listeUpload.setDrag}
            file={listeUpload.file}
            loadingKind={listeUpload.loadingKind}
            error={listeUpload.error}
            onPick={listeUpload.onPick}
            sonuc={listeUpload.sonuc}
            teklifV14={listeUpload.teklifV14}
            reset={resetListeUpload}
            largePane={listeWide}
            hideTitle={activePane === "balanced"}
          />
        </div>
      </aside>
    );
  }

  if (finished && !sonuc && !loading) {
    const secilenYardimci = answers.q_yardimci_ekipman ?? [];
    const secilenElkGaz = answers.q_elektrik_gaz ?? [];
    return (
      <PfosWorkspaceShell
        activePane="wizard"
        pipelineSteps={WIZARD_PIPELINE}
        pipelineActive="teklif"
        summary={liveSummary}
      >
        <section className={`${styles.sec} ${styles.secVis} ${styles.secActive}`}>
          <div className={styles.secHd}>
            <span className={styles.secNum}>✓</span>
            <span className={styles.secInfo}>
              <span className={styles.secTitle}>{t("Teşekkürler")}</span>
              <span className={styles.secSub}>
                {t(
                  "Detaylandırma tercihiniz alındı; ekibimiz sizinle iletişime geçecek.",
                )}
              </span>
            </span>
          </div>
          {secilenYardimci.length || secilenElkGaz.length ? (
            <div className={styles.secBd}>
              {secilenYardimci.length ? (
                <>
                  <p className={styles.detayOzetBaslik}>
                    {t("Seçilen yardımcı ekipman")}
                  </p>
                  <ul className={styles.detayOzetList}>
                    {secilenYardimci.map((item) => (
                      <li key={item}>{t(item)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {secilenElkGaz.length ? (
                <>
                  <p className={styles.detayOzetBaslik}>
                    {t("Altyapı ve bağlantı")}
                  </p>
                  <ul className={styles.detayOzetList}>
                    {secilenElkGaz.map((item) => (
                      <li key={item}>{t(item)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </section>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={resetWizard}
        >
          {t("Yeni proje")}
        </button>
      </PfosWorkspaceShell>
    );
  }

  return (
    <PfosWorkspaceShell
      activePane={activePane}
      pipelineSteps={pipelineSteps}
      pipelineActive={pipelineActive}
      summary={liveSummary}
    >
      <div
        className={ws.balancedPane}
        data-pfos-pane={activePane}
        data-pfos-liste-ready={listeHasContent ? "" : undefined}
      >
        {activePane === "balanced" ? (
          <>
            <div className={ws.balancedPaneHeadLeft}>
              <h2 className={ws.wizardIntroTitle}>
                {t("Konsept Sihirbazı")}
              </h2>
              {renderWizardIntroExtra()}
            </div>
            <h2 className={`${ws.uploadTitle} ${ws.uploadTitleHead}`}>
              {t("Listeni yükle fiyatlandıralım.")}
            </h2>
          </>
        ) : null}
        <div className={ws.balancedPaneLeft}>
          <div
            className={[
              styles.leftCol,
              wizardPaneCollapsed ? styles.paneCollapsed : "",
              activePane !== "liste" ? styles.paneExpanded : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={leftColRef}
          >
            <div
              className={styles.paneBody}
              onPointerDown={
                activePane !== "wizard" ? engageWizardPane : undefined
              }
            >
              {renderWizardCenter({ hideIntro: activePane === "balanced" })}
            </div>
          </div>
        </div>
        <div className={ws.balancedPaneRight}>{renderListePane()}</div>
      </div>
    </PfosWorkspaceShell>
  );
}
