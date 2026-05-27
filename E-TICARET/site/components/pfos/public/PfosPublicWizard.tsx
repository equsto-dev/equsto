"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const M2_PRESETS = [15, 40, 80, 120, 200, 350];

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
  const [questions, setQuestions] = useState<WizardQuestion[]>(
    initialQuestions ?? defaultPublicQuestions(),
  );
  const [shopTypes, setShopTypes] = useState<ShopTypeRow[]>([]);
  const [answers, setAnswers] = useState<SoruCevapHaritasi>({});
  const [donePanels, setDonePanels] = useState<Set<string>>(new Set());
  const [activePanelId, setActivePanelId] = useState("s1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [finished, setFinished] = useState(false);

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

  const motorGirdi = useMemo(
    () => soruCevaplarindanMotorGirdi(answers),
    [answers],
  );
  const motorSlug = useMemo(
    () => dukkanSecimdenMotorSlug(motorGirdi.dukkanSecim, shopTypes),
    [motorGirdi.dukkanSecim, shopTypes],
  );
  const konsept = parseKonsept(motorSlug);

  const hint = useMemo(
    () => wizardHint(panels, donePanels, activePanelId),
    [panels, donePanels, activePanelId],
  );

  const panelVisible = useCallback(
    (panel: LegacyPanelDef, index: number) => {
      if (index === 0) return true;
      const prev = panels[index - 1];
      return prev ? donePanels.has(prev.id) : false;
    },
    [panels, donePanels],
  );

  const completePanel = useCallback(
    (panelId: string) => {
      const idx = panels.findIndex((p) => p.id === panelId);
      if (idx < 0) return;
      setDonePanels((prev) => new Set([...prev, panelId]));
      const next = panels[idx + 1];
      setActivePanelId(next?.id ?? panelId);
      setError(null);
    },
    [panels],
  );

  const reopenPanel = useCallback(
    (panelId: string) => {
      const idx = panels.findIndex((p) => p.id === panelId);
      if (idx < 0) return;
      setFinished(false);
      setSonuc(null);
      setTeklifV14(null);
      setDonePanels((prev) => {
        const next = new Set(prev);
        for (let i = idx; i < panels.length; i++) next.delete(panels[i].id);
        return next;
      });
      setActivePanelId(panelId);
    },
    [panels],
  );

  const setAnswer = useCallback(
    (
      id: keyof SoruCevapHaritasi,
      value: string | string[],
      panel?: LegacyPanelDef,
      autoAdvance = true,
    ) => {
      setAnswers((prev) => {
        let merged = clearDownstreamAnswers({ ...prev, [id]: value }, id);
        if (
          id === "q_m2" &&
          !bulutDukkanGecerliMi(String(merged.q_dukkan_turu ?? ""), merged)
        ) {
          merged = { ...merged, q_dukkan_turu: "" };
        }
        if (
          autoAdvance &&
          panel &&
          id !== "q_karar" &&
          isLegacyPanelComplete(panel, questions, merged)
        ) {
          const qs = panelQuestions(panel, questions, merged);
          const singleSelect =
            qs.length === 1 &&
            (qs[0].type === "select" || qs[0].type === "select_conditional");
          if (singleSelect) {
            setTimeout(() => completePanel(panel.id), 0);
          }
        }
        return merged;
      });
      setError(null);
      setFinished(false);
      setSonuc(null);
      setTeklifV14(null);
    },
    [questions, completePanel],
  );

  const toggleMulti = (opt: string) => {
    const cur = answers.q_ne_pisireceksin;
    const arr = Array.isArray(cur) ? [...cur] : cur ? [String(cur)] : [];
    const i = arr.indexOf(opt);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(opt);
    setAnswers((prev) => clearDownstreamAnswers({ ...prev, q_ne_pisireceksin: arr }, "q_ne_pisireceksin"));
    setFinished(false);
    setSonuc(null);
    setTeklifV14(null);
  };

  async function finalize(kararOpt?: string) {
    const karar = kararOpt ?? String(answers.q_karar ?? "");
    if (karar.includes("detaylandır")) {
      setFinished(true);
      completePanel("s6");
      return;
    }

    if (!konsept) {
      setError(
        motorGirdi.dukkanSecim
          ? `"${motorGirdi.dukkanSecim}" için teklif motoru henüz bağlı değil.`
          : "Dükkan türü seçilmedi.",
      );
      return;
    }

    const m2 = motorGirdi.m2;
    if (m2 < 20) {
      setError("Toplam alan en az 20 m² olmalı.");
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
          (data as { error?: string }).error ?? "Teklif oluşturulamadı",
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
      completePanel("s6");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen hata");
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
    setDonePanels(new Set());
    setActivePanelId("s1");
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
            Bulut mutfak: {BULUT_KOMPAKT_M2_MAX} m² ve altında yalnızca Grab&amp;Go
            ve Coffee Counter konseptleri açılır.
          </p>
        ) : null}
        <div className={styles.alanHero}>
          <input
            type="number"
            className={styles.alanInput}
            min={minM2}
            max={2000}
            value={val}
            onChange={(e) => setAnswer("q_m2", e.target.value, panel, false)}
          />
          <span className={styles.alanUnit}>m²</span>
        </div>
        <input
          type="range"
          className={styles.alanRange}
          min={minM2}
          max={1000}
          value={Math.min(Math.max(val, minM2), 1000)}
          onChange={(e) => setAnswer("q_m2", e.target.value, panel, false)}
        />
        <div className={styles.alanPresets} role="group">
          {M2_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.presetBtn}${val === n ? ` ${styles.presetBtnActive}` : ""}`}
              onClick={() => setAnswer("q_m2", String(n), panel, false)}
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
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGold}`}
          disabled={val < minM2}
          onClick={() => {
            if (isLegacyPanelComplete(panel, questions, answers)) {
              completePanel(panel.id);
            }
          }}
        >
          Devam
        </button>
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
              {opt}
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
              Alan {BULUT_KOMPAKT_M2_MAX} m² altı — kompakt konsept listesi
              gösteriliyor.
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
                {opt}
              </button>
            ))}
          </div>
          {panel.id === "s1" ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ marginTop: 10 }}
              onClick={() => completePanel(panel.id)}
            >
              Atla / Devam
            </button>
          ) : null}
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
                  onChange={() => toggleMulti(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGold}`}
            style={{ marginTop: 12 }}
            disabled={selected.length === 0}
            onClick={() => completePanel(panel.id)}
          >
            Devam
          </button>
        </>
      );
    }

    if (q.id === "q_lokasyon") {
      const adresForm = answersToAdresForm(answers);
      return (
        <PfosAdresAutocomplete
          value={adresForm}
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
          onDevam={() => completePanel(panel.id)}
        />
      );
    }

    return (
      <>
        <input
          className={styles.textInput}
          type="text"
          value={answers[id] != null ? String(answers[id]) : ""}
          onChange={(e) => setAnswer(id, e.target.value, panel, false)}
          placeholder="Marka adı…"
        />
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          style={{ marginTop: 10 }}
          onClick={() => completePanel(panel.id)}
        >
          Atla / Devam
        </button>
      </>
    );
  }

  function renderPanel(panel: LegacyPanelDef, index: number) {
    if (!panelVisible(panel, index)) return null;
    const qs = panelQuestions(panel, questions, answers);
    if (qs.length === 0 && panel.skipIfEmpty) return null;

    const isDone = donePanels.has(panel.id);
    const isActive = activePanelId === panel.id && !isDone;
    const summary = panelAnswerSummary(panel, answers);

    return (
      <section
        key={panel.id}
        className={`${styles.sec} ${styles.secVis}${isDone ? ` ${styles.secDone}` : ""}${isActive ? ` ${styles.secActive}` : ""}`}
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
            <span className={styles.secTitle}>{panel.title}</span>
            {isActive ? (
              <span className={styles.secSub}>{panel.sub}</span>
            ) : null}
            {summary && isDone ? (
              <span className={styles.secAns}>{summary}</span>
            ) : null}
          </span>
        </button>
        {isActive ? (
          <div className={styles.secBd}>
            {qs.map((q) => (
              <div key={q.id}>
                {q.id !== "q_m2" &&
                q.id !== "q_lokasyon" &&
                q.id !== "q_karar" ? (
                  <>
                    {q.text ? (
                      <h3 className={styles.qInlineTitle}>{String(q.text)}</h3>
                    ) : null}
                    {q.note ? (
                      <p className={styles.questionNote}>{String(q.note)}</p>
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
                <span className={styles.secTitle}>Teşekkürler</span>
                <span className={styles.secSub}>
                  Detaylandırma tercihiniz alındı; ekibimiz sizinle iletişime geçecek.
                </span>
              </span>
            </div>
          </section>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={resetWizard}
          >
            Yeni proje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.leftCol}>
        <p className={styles.mreGreeting}>
          Ben Gastronomi Mekan Tasarımcısı Mr. Equsto. Hoş geldin.
        </p>
        <p className={styles.mreMotto}>Beş dakikada yapılır, hemen teslim edilir.</p>

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
                  Yeni proje
                </button>
              </div>
            </section>
            <div className={styles.proformaWrap}>
              <TeklifV14Proforma model={teklifV14} />
            </div>
          </>
        ) : null}

        {loading ? (
          <p className={styles.questionNote}>Teklif hesaplanıyor…</p>
        ) : null}
      </div>

      <aside className={styles.rightCol} aria-label="Referans ve notlar">
        <section className={styles.railSection}>
          <span className={styles.railKicker}>Referans metinler</span>
          <span className={styles.railTitle}>Konseptinize uygun sahadan notlar</span>
          <p className={styles.railPlaceholder}>
            {motorGirdi.dukkanSecim ? (
              <>
                <b>{motorGirdi.dukkanSecim}</b> segmenti için ekipman listesi motor
                tarafından oluşturulur.
              </>
            ) : (
              <>
                <b>Henüz konsept seçilmedi.</b> Soldaki soru akışında işletme
                konseptinizi seçtiğinizde bu bölümde segment notları listelenir.
              </>
            )}
          </p>
        </section>
        <section className={styles.railSection}>
          <span className={styles.railKicker}>Teklif motoru</span>
          <span className={styles.railTitle}>Bağlantı durumu</span>
          <dl className={styles.railMeta}>
            <dt>Konsept</dt>
            <dd>{motorGirdi.dukkanSecim || "—"}</dd>
            <dt>Motor</dt>
            <dd>{motorSlug || "planlanan"}</dd>
            <dt>Alan</dt>
            <dd>{motorGirdi.m2 ? `${motorGirdi.m2} m²` : "—"}</dd>
            <dt>Lokasyon</dt>
            <dd>{motorGirdi.lokasyon || "—"}</dd>
          </dl>
        </section>
      </aside>
    </div>
  );
}
