"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  defaultPublicQuestions,
  dukkanSecenekleri,
  type WizardQuestion,
} from "@/lib/pfos/wizard/public-flow";
import {
  bulutDukkanGecerliMi,
  bulutMutfakKompaktMi,
  BULUT_KOMPAKT_M2_MAX,
} from "@/lib/pfos/wizard/bulut-mutfak-kompakt";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
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

const M2_PRESETS = [40, 80, 120, 200, 350];

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function parseKonsept(slug: string | null): Konsept | null {
  if (!slug) return null;
  const r = KonseptEnum.safeParse(slug);
  return r.success ? r.data : null;
}

export default function PfosPublicWizard({ initialQuestions }: Props) {
  const { t } = usePfosLabel();
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
  const [enteringPanelId, setEnteringPanelId] = useState<string | null>(null);
  const [m2Touched, setM2Touched] = useState(false);
  const [adresListOpen, setAdresListOpen] = useState(false);
  const prevOpenPanelIdRef = useRef("s1");

  useEffect(() => {
    setAdresListOpen(false);
  }, [openPanelIndex]);

  useEffect(() => {
    let cancelled = false;
    void loadTrAdres();
    void (async () => {
      const { fetchProjeAkis } = await import("@/lib/pro-admin-client");
      const { data } = await fetchProjeAkis();
      if (cancelled || !data) return;
      if (Array.isArray(data.questions) && data.questions.length) {
        setQuestions(data.questions as WizardQuestion[]);
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

  const openPanelId = panels[openPanelIndex]?.id ?? "s1";

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

  const openPanelIndexRef = useRef(openPanelIndex);
  useEffect(() => {
    if (openPanelIndex <= openPanelIndexRef.current) {
      openPanelIndexRef.current = openPanelIndex;
      return;
    }
    openPanelIndexRef.current = openPanelIndex;
    const openId = panels[openPanelIndex]?.id;
    if (!openId) return;
    setEnteringPanelId(openId);
    const t = window.setTimeout(() => {
      setEnteringPanelId(null);
      document
        .getElementById(`pfos-sec-${openId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 420);
    return () => window.clearTimeout(t);
  }, [openPanelIndex, panels]);

  const motorGirdi = useMemo(
    () => soruCevaplarindanMotorGirdi(answers),
    [answers],
  );
  const motorSlug = useMemo(
    () => dukkanSecimdenMotorSlug(motorGirdi.dukkanSecim, shopTypes),
    [motorGirdi.dukkanSecim, shopTypes],
  );
  const konsept = parseKonsept(motorSlug);

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

    setLoading(true);
    setError(null);
    try {
      const sehir = motorGirdi.lokasyon || "İstanbul";
      const res = await fetch("/api/pfos/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konsept,
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
      const data = await res.json();
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

  function onKararSelect(opt: string) {
    setAnswers((prev) => ({ ...prev, q_karar: opt }));
  setError(null);
    if (opt.includes("detaylandır")) {
      void finalize(opt);
      return;
    }
    if (opt.includes("Teklifi al") || opt.includes("PDF")) {
      void finalize(opt);
    }
  }

  function resetWizard() {
    setAnswers({});
    setM2Touched(false);
    prevOpenPanelIdRef.current = "s1";
    openPanelIndexRef.current = 0;
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
            max={2000}
            value={val}
            onChange={(e) => setM2Value(e.target.value)}
          />
          <span className={styles.alanUnit}>m²</span>
        </div>
        <input
          type="range"
          className={styles.alanRange}
          min={minM2}
          max={1000}
          value={Math.min(Math.max(val, minM2), 1000)}
          onChange={(e) => setM2Value(e.target.value)}
        />
        <div className={styles.alanPresets} role="group">
          {M2_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.presetBtn}${val === n ? ` ${styles.presetBtnActive}` : ""}`}
              onClick={() => setM2Value(String(n))}
            >
              {n} m²
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
      return (
        <div className={styles.options}>
          {((q.options as string[]) ?? []).map((opt) => (
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
      );
    }

    if (q.type === "select" || q.type === "select_conditional") {
      const opts =
        q.type === "select_conditional"
          ? dukkanSecenekleri(q, answers)
          : ((q.options as string[]) ?? []);
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
            {((q.options as string[]) ?? []).map((opt) => (
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
        className={`${styles.sec} ${styles.secVis}${isDone ? ` ${styles.secDone}` : ""}${isActive ? ` ${styles.secActive}` : ""}${isActive && adresListOpen && qs.some((q) => q.id === "q_lokasyon") ? ` ${styles.secAdresExpanded}` : ""}${enteringPanelId === panel.id ? ` ${styles.secEnter}` : ""}`}
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

  if (finished && !sonuc && !loading) {
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
          </section>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={resetWizard}
          >
            {t("Yeni proje")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.leftCol}>
        <p className={styles.mreGreeting}>
          {t("Ben Gastronomi Mekan Tasarımcısı Mr. Equsto. Hoş geldin.")}
        </p>
        <p className={styles.mreMotto}>
          {t("Beş dakikada yapılır, hemen teslim edilir.")}
        </p>

        <div className={styles.pfProgress}>
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
            <section className={`${styles.sec} ${styles.secVis} ${styles.secDone}`}>
              <div className={styles.secHd}>
                <span className={styles.secNum}>✓</span>
                <span className={styles.secInfo}>
                  <span className={styles.secTitle}>Örnek listeniz hazır</span>
                  <span className={styles.secSub}>
                    {sonuc.konseptLabel} · {motorGirdi.m2} m² ·{" "}
                    {sonuc.kalemler?.length ?? 0} kalem
                  </span>
                  <span className={styles.teklifTotalInline}>
                    {formatTry(sonuc.ozet?.toplamFiyat ?? 0)}{" "}
                    <small>(tahmini, KDV hariç)</small>
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
            <div className={styles.proformaWrap}>
              <TeklifV14Proforma model={teklifV14} />
            </div>
          </>
        ) : null}

        {loading ? (
          <p className={styles.questionNote}>{t("Teklif hesaplanıyor…")}</p>
        ) : null}
      </div>

      <aside className={styles.rightCol} aria-label={t("Referans ve notlar")}>
        <section className={styles.railSection}>
          <span className={styles.railKicker}>{t("Referans metinler")}</span>
          <span className={styles.railTitle}>
            {t("Konseptinize uygun sahadan notlar")}
          </span>
          <p className={styles.railPlaceholder}>
            {motorGirdi.dukkanSecim ? (
              <>
                <b>{t(motorGirdi.dukkanSecim)}</b>
                {t("segmenti için ekipman listesi motor tarafından oluşturulur.")}
              </>
            ) : (
              <>
                <b>{t("Henüz konsept seçilmedi.")}</b>{" "}
                {t(
                  "Soldaki soru akışında işletme konseptinizi seçtiğinizde bu bölümde segment notları listelenir.",
                )}
              </>
            )}
          </p>
        </section>
        <section className={styles.railSection}>
          <span className={styles.railKicker}>{t("Teklif motoru")}</span>
          <span className={styles.railTitle}>{t("Bağlantı durumu")}</span>
          <dl className={styles.railMeta}>
            <dt>{t("Konsept")}</dt>
            <dd>{motorGirdi.dukkanSecim ? t(motorGirdi.dukkanSecim) : "—"}</dd>
            <dt>{t("Motor")}</dt>
            <dd>{motorSlug || t("planlanan")}</dd>
            <dt>{t("Alan")}</dt>
            <dd>{motorGirdi.m2 ? `${motorGirdi.m2} m²` : "—"}</dd>
            <dt>{t("Lokasyon")}</dt>
            <dd>{motorGirdi.lokasyon || "—"}</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
