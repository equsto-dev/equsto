"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Konsept, PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import { KonseptEnum } from "@/lib/pfos/schemas/pfos.schema";
import {
  dukkanSecimdenMotorSlug,
  soruCevaplarindanMotorGirdi,
  type SoruCevapHaritasi,
} from "@/lib/pfos/proje-akis/soru-motor-mapping";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import { fetchTcmbKurForTeklif } from "@/lib/pfos/teklif/fetch-kur.client";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import TeklifV14Proforma from "@/components/pfos/TeklifV14Proforma";
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
import PfosListeUploadRail from "./PfosListeUploadRail";
import { usePfosListeUpload } from "./usePfosListeUpload";
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
import {
  PFOS_ELK_GAZ_SECENEKLERI,
  yardimciEkipmanForKonsept,
} from "@/lib/pfos/wizard/yardimci-ekipman";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import {
  memberLoggedInNow,
  pfosLoginHref,
  pfosRegisterHref,
} from "@/lib/pfos/member-session.client";
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

async function readFetchJson<T>(
  res: Response,
  emptyMessage: string,
  invalidMessage: string,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(emptyMessage);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(invalidMessage);
  }
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
  const [detayPanelOpen, setDetayPanelOpen] = useState(false);
  const [yardimciSecim, setYardimciSecim] = useState<string[]>([]);
  const [elkGazSecim, setElkGazSecim] = useState<string[]>([]);
  const [memberReady, setMemberReady] = useState(false);
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");
  const [registerHref, setRegisterHref] = useState("/login?mode=register");
  const prevOpenPanelIdRef = useRef("s1");
  const enterTimerRef = useRef<number | null>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [uploadAlign, setUploadAlign] = useState<{
    marginTop: number;
    height: number;
  } | null>(null);

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

  /* KİLİT: public/pfos-liste-upload-rail-KILIT.txt — üst=Başlayalım, alt=meslek s1 */
  useLayoutEffect(() => {
    if (wizardListeMode || !memberLoggedIn) {
      setUploadAlign(null);
      return;
    }

    const leftCol = leftColRef.current;
    const progress = document.getElementById("pfos-progress");
    const meslek = document.getElementById("pfos-sec-s1");
    if (!leftCol || !progress || !meslek) {
      setUploadAlign(null);
      return;
    }

    const measure = () => {
      const colTop = leftCol.getBoundingClientRect().top;
      const progressTop = progress.getBoundingClientRect().top;
      const meslekBottom = meslek.getBoundingClientRect().bottom;
      const marginTop = Math.round(progressTop - colTop);
      const height = Math.round(meslekBottom - progressTop);
      setUploadAlign(
        marginTop >= 0 && height > 120
          ? { marginTop, height }
          : null,
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(leftCol);
    ro.observe(progress);
    ro.observe(meslek);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [
    wizardListeMode,
    memberLoggedIn,
    openPanelIndex,
    panels.length,
    animatingPanelId,
    animatingPanelReveal,
    adresListOpen,
    answers.q_meslek,
  ]);

  const openPanelId = panels[openPanelIndex]?.id ?? "s1";

  useEffect(() => {
    setAdresListOpen(false);
  }, [openPanelIndex]);

  useEffect(() => {
    if (openPanelId === "s5" && prevOpenPanelIdRef.current !== "s5") {
      setM2Touched(false);
      setAnswers((prev) => {
        if (prev.q_m2 != null && String(prev.q_m2).trim() !== "") return prev;
        return { ...prev, q_m2: "80" };
      });
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
      const sel = pf?.dukkanSecim?.trim();
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

  const yardimciOneriler = useMemo(
    () =>
      yardimciEkipmanForKonsept(
        String(answers.q_dukkan_turu ?? ""),
        String(answers.q_ust_segment ?? ""),
      ),
    [answers.q_dukkan_turu, answers.q_ust_segment],
  );

  const hint = useMemo(() => {
    const h = wizardHint(panels, donePanelIds, openPanelId);
    return { pct: h.pct, title: t(h.title), sub: t(h.sub) };
  }, [panels, donePanelIds, openPanelId, t]);

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
    setAnswers((prev) => {
      let merged = clearDownstreamAnswers({ ...prev, q_m2: value }, "q_m2");
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

  async function finalize(kararOpt?: string) {
    const karar = kararOpt ?? String(answers.q_karar ?? "");
    if (karar.includes("detaylandır")) {
      setFinished(true);
      return;
    }

    if (!konsept) {
      setError(
        motorGirdi.dukkanSecim
          ? `"${t(motorGirdi.dukkanSecim)}"${t("için teklif motoru henüz bağlı değil.")}`
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
      setTeklifV14(
        pfosResponseToTeklifV14(data as PFOSResponse, {
          projeAdi: `${motorGirdi.dukkanSecim}${m2 ? ` · ${m2} m²` : ""}`,
          musteri: motorGirdi.franchiseMarka ?? "",
          teslimatAdresi:
            [motorGirdi.lokasyon, motorGirdi.adresNot].filter(Boolean).join(" · ") ||
            "—",
          bolumM2: (data as PFOSResponse).bolumM2 ?? {},
          eurTry: snap?.rate ?? null,
        }),
      );
      setFinished(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Beklenmeyen hata"));
    } finally {
      setLoading(false);
    }
  }

  function openDetayPanel() {
    setYardimciSecim(yardimciOneriler);
    setElkGazSecim([]);
    setDetayPanelOpen(true);
    setFinished(false);
    setSonuc(null);
    setTeklifV14(null);
  }

  function toggleYardimci(item: string) {
    setYardimciSecim((prev) => {
      const i = prev.indexOf(item);
      if (i >= 0) return prev.filter((x) => x !== item);
      return [...prev, item];
    });
  }

  function toggleElkGaz(item: string) {
    setElkGazSecim((prev) => {
      const i = prev.indexOf(item);
      if (i >= 0) return prev.filter((x) => x !== item);
      return [...prev, item];
    });
  }

  function detayTamamla() {
    setAnswers((prev) => ({
      ...prev,
      q_yardimci_ekipman: yardimciSecim,
      q_elektrik_gaz: elkGazSecim,
    }));
    setDetayPanelOpen(false);
    setFinished(true);
  }

  function onKararSelect(opt: string) {
    setAnswers((prev) => ({ ...prev, q_karar: opt }));
    setError(null);
    if (opt.includes("detaylandır")) {
      openDetayPanel();
      return;
    }
    setDetayPanelOpen(false);
    if (opt.includes("Teklifi al") || opt.includes("PDF")) {
      setLoading(true);
      void finalize(opt);
    }
  }

  function resetWizard() {
    setAnswers({});
    setM2Touched(false);
    setDetayPanelOpen(false);
    setYardimciSecim([]);
    setElkGazSecim([]);
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
    const raw = answers.q_m2 != null ? Number(answers.q_m2) : 80;
    const val = Number.isFinite(raw) ? raw : 80;
    const bulutSeg =
      String(answers.q_ust_segment ?? "").trim() === "Bulut Mutfak";
    const minM2 = bulutSeg ? 8 : 20;
    return (
      <div className={styles.alanField}>
        {bulutSeg ? (
          <p className={styles.alanHint} style={{ marginBottom: 10 }}>
            {t(
              `Bulut mutfak: ${BULUT_KOMPAKT_M2_MAX} m² ve altında yalnızca Grab&Go ve Coffee Counter konseptleri açılır.`,
            )}
          </p>
        ) : null}
        <div className={styles.alanHero}>
          <input
            type="number"
            className={styles.alanInput}
            min={minM2}
            max={10000}
            value={val}
            onChange={(e) => setM2Value(e.target.value)}
          />
          <span className={styles.alanUnit}>m²</span>
        </div>
        <div className={styles.alanPresets} role="group">
          {M2_PRESETS.map((n, i) => (
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
        {motorGirdi.dukkanSecim ? (
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

    if (q.id === "q_karar") {
      const val = String(answers[id] ?? "");
      const opts = ((q.options as string[]) ?? []).filter(
        (o) => o !== "Bilmiyorum",
      );
      const konseptLabel =
        motorGirdi.dukkanSecim || String(answers.q_ust_segment ?? "");
      return (
        <>
          <div className={styles.options}>
            {opts.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${styles.optionBtn}${val === opt ? ` ${styles.optionBtnSelected}` : ""}`}
                disabled={loading}
                onClick={() => onKararSelect(opt)}
              >
                {t(opt)}
              </button>
            ))}
          </div>
          {detayPanelOpen && val.includes("detaylandır") ? (
            <div className={styles.detayPanel} role="region" aria-label={t("Proje detayı")}>
              <p className={styles.detayPanelLead}>
                {konseptLabel ? (
                  <>
                    <b>{t(konseptLabel)}</b>
                    {" · "}
                  </>
                ) : null}
                {t(
                  "konseptiniz için önerilen opsiyonel yardımcı ekipman — istemediklerinizi kaldırabilirsiniz.",
                )}
              </p>
              <div className={styles.detayChipGrid}>
                {yardimciOneriler.map((item) => {
                  const sel = yardimciSecim.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.detayChip}${sel ? ` ${styles.detayChipSelected}` : ""}`}
                      onClick={() => toggleYardimci(item)}
                    >
                      <span className={styles.detayChipMark} aria-hidden="true">
                        {sel ? "✓" : ""}
                      </span>
                      {t(item)}
                    </button>
                  );
                })}
              </div>
              <p className={styles.detayPanelSub}>{t("Altyapı ve bağlantı")}</p>
              <div className={styles.detayCheckGrid}>
                {PFOS_ELK_GAZ_SECENEKLERI.map((item) => {
                  const sel = elkGazSecim.includes(item);
                  return (
                    <label
                      key={item}
                      className={`${styles.detayCheck}${sel ? ` ${styles.detayCheckSelected}` : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleElkGaz(item)}
                      />
                      {t(item)}
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.detayPanelBtn}`}
                onClick={detayTamamla}
              >
                {t("Tercihleri kaydet")}
              </button>
            </div>
          ) : null}
          {loading ? (
            <PfosTeklifLoading label={t("Teklif hesaplanıyor…")} />
          ) : null}
        </>
      );
    }

    if (q.type === "select" || q.type === "select_conditional") {
      const rawOpts =
        q.type === "select_conditional"
          ? dukkanSecenekleri(q, answers, m2ByDukkan)
          : ((q.options as string[]) ?? []);
      const opts =
        q.id === "q_ust_segment"
          ? rawOpts.filter((o) => o !== "Bilmiyorum")
          : rawOpts;
      const val = String(answers[id] ?? "");
      const twoCol = opts.length > 6;
      const bulutKompakt =
        q.id === "q_dukkan_turu" && bulutMutfakKompaktMi(answers);
      return (
        <>
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
            {opts.map((opt, i) => (
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
            {((q.options as string[]) ?? []).map((opt, i) => (
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
        className={`${styles.sec} ${styles.secVis}${isDone ? ` ${styles.secDone}` : ""}${isActive ? ` ${styles.secActive}` : ""}${isActive && adresListOpen && qs.some((q) => q.id === "q_lokasyon") ? ` ${styles.secAdresExpanded}` : ""}${panelEntering ? ` ${styles.secPending}` : ""}${panelRevealing ? ` ${styles.secReveal}` : ""}`}
      >
        <button
          type="button"
          className={styles.secHd}
          onClick={() => {
            if (isDone) reopenPanel(panel.id);
          }}
        >
          <span className={styles.secNum}>{isDone ? "✓" : panel.num}</span>
          <span className={styles.secInfo}>
            <span className={styles.secTitle}>{t(panel.title)}</span>
            {isActive ? (
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

  function renderListeProformaRail() {
    if (!listeUpload.sonuc || !listeUpload.teklifV14) return null;

    return (
      <>
        <section
          className={`${styles.railSection} ${styles.railSectionListeSonuc}`}
          aria-label={t("Liste fiyatlandırma sonucu")}
        >
          <span className={styles.railKicker}>{t("Liste yükleme")}</span>
          <span className={styles.railTitle}>{t("Listeniz fiyatlandırıldı")}</span>
          <p className={styles.railPlaceholder}>
            {listeUpload.sonuc.konseptLabel} ·{" "}
            {listeUpload.sonuc.kalemler?.length ?? 0} {t("kalem")} ·{" "}
            {listeUpload.sonuc.ozet?.eslesmeSayisi ?? 0} {t("eşleşme")}
          </p>
          <p className={styles.railListeToplam}>
            {formatTry(listeUpload.sonuc.ozet?.toplamFiyat ?? 0)}{" "}
            <small>({t("tahmini, KDV hariç")})</small>
          </p>
          {listeUpload.sonuc.uyarilar?.length ? (
            <ul className={styles.listeUyarilar}>
              {listeUpload.sonuc.uyarilar.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.railListeReset}`}
            onClick={listeUpload.reset}
          >
            {t("Yeni liste yükle")}
          </button>
        </section>
        <div className={styles.proformaWrapRail}>
          <TeklifV14Proforma
            model={listeUpload.teklifV14}
            deliveryOnly
          />
        </div>
      </>
    );
  }

  function renderRightRail(alignUpload = false) {
    return (
      <aside className={styles.rightCol} aria-label={t("Liste yükleme")}>
        <div
          className={alignUpload ? styles.uploadRailAlign : undefined}
          style={
            alignUpload && uploadAlign != null
              ? {
                  marginTop: uploadAlign.marginTop,
                  height: uploadAlign.height,
                }
              : undefined
          }
        >
          <PfosListeUploadRail
            fillHeight={alignUpload && uploadAlign != null}
            inputRef={listeUpload.inputRef}
          drag={listeUpload.drag}
          setDrag={listeUpload.setDrag}
          file={listeUpload.file}
          loadingKind={listeUpload.loadingKind}
          error={listeUpload.error}
          memberReady={listeUpload.memberReady}
          memberLoggedIn={listeUpload.memberLoggedIn}
          loginHref={listeUpload.loginHref}
          onPick={listeUpload.onPick}
        />
        </div>
        {renderListeProformaRail()}
      </aside>
    );
  }

  function renderMemberGate() {
    return (
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <p className={styles.mreGreeting}>
            {t("Ben Gastronomi Mekan Tasarımcısı Mr. Equsto. Hoş geldin.")}
          </p>
          <p className={styles.mreMotto}>
            {t("Beş dakikada yapılır, hemen teslim edilir.")}
          </p>
          <div className={styles.memberGate}>
            <h2 className={styles.memberGateTitle}>
              {t("Devam etmek için üye girişi")}
            </h2>
            <p className={styles.memberGateSub}>
              {t(
                "Teklif almak ve PDF'inizi e-posta veya WhatsApp ile almak için Equsto hesabınızla giriş yapın.",
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
        {renderRightRail()}
      </div>
    );
  }

  if (!memberReady) {
    return null;
  }

  if (!memberLoggedIn) {
    return renderMemberGate();
  }

  if (finished && !sonuc && !loading) {
    const secilenYardimci = answers.q_yardimci_ekipman ?? [];
    const secilenElkGaz = answers.q_elektrik_gaz ?? [];
    return (
      <div className={styles.layout}>
        <div className={styles.leftCol}>
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
        </div>
        {renderRightRail()}
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.leftCol} ref={leftColRef}>
        <p className={styles.mreGreeting}>
          {t("Ben Gastronomi Mekan Tasarımcısı Mr. Equsto. Hoş geldin.")}
        </p>
        <p className={styles.mreMotto}>
          {t("Beş dakikada yapılır, hemen teslim edilir.")}
        </p>

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

        <div id="secs">{panels.map(renderPanel)}</div>

        {error ? <div className={styles.error}>{error}</div> : null}

        {finished && sonuc && teklifV14 ? (
          <>
            <section
              className={`${styles.sec} ${styles.secVis} ${styles.secDone}${resultEntering ? ` ${styles.secPending}` : ""}${resultReveal ? ` ${styles.secReveal}` : ""}`}
            >
              <div className={styles.secHd}>
                <span className={styles.secNum}>✓</span>
                <span className={styles.secInfo}>
                  <span className={styles.secTitle}>
                    {t("Örnek listeniz hazır")}
                  </span>
                  <span className={styles.secSub}>
                    {sonuc.konseptLabel} · {motorGirdi.m2} m² ·{" "}
                    {sonuc.kalemler?.length ?? 0} {t("kalem")}
                  </span>
                  <span className={styles.teklifTotalInline}>
                    {formatTry(sonuc.ozet?.toplamFiyat ?? 0)}{" "}
                    <small>({t("tahmini, KDV hariç")})</small>
                  </span>
                </span>
              </div>
              <div className={styles.secBd}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={resetWizard}
                >
                  {t("Yeni proje")}
                </button>
              </div>
            </section>
            <div
              className={`${styles.proformaWrap}${resultEntering ? ` ${styles.secPending}` : ""}${resultReveal ? ` ${styles.secReveal}` : ""}`}
            >
              <TeklifV14Proforma model={teklifV14} deliveryOnly />
            </div>
          </>
        ) : null}
      </div>

      {renderRightRail(!wizardListeMode)}
    </div>
  );
}
