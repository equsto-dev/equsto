import type { SoruCevapHaritasi } from "@/lib/pfos/proje-akis/soru-motor-mapping";
import {
  answersToAdresForm,
  isAdresFormValid,
} from "@/lib/pfos/adres/tr-adres";
import {
  evaluateGosterIf,
  isQuestionAnswered,
  type WizardQuestion,
} from "./public-flow";

export type LegacyPanelDef = {
  id: string;
  num: string;
  title: string;
  sub: string;
  questionIds: string[];
  /** Panel boş kalırsa (koşullu alt soru yok) atlanır */
  skipIfEmpty?: boolean;
  /** Tamamlanması zorunlu değil — boş geçilebilir */
  optional?: boolean;
  showIf?: (answers: SoruCevapHaritasi) => boolean;
};

/** pfos.html SEC_ORDER ile uyumlu: meslek → adres → m² → konsept → karar */
export const LEGACY_PANELS: LegacyPanelDef[] = [
  {
    id: "s1",
    num: "01",
    title: "Mesleğini söylemek ister misin?",
    sub: "İsterseniz rolünüzü seçin; seçmezseniz de devam edebilirsiniz.",
    questionIds: ["q_meslek"],
    optional: true,
  },
  {
    id: "s2",
    num: "02",
    title: "Şehir ve teslimat adresi",
    sub: "Nakliye ve montaj tahmini için il ve adres bilgisi.",
    questionIds: ["q_lokasyon"],
  },
  {
    id: "s5",
    num: "03",
    title: "Toplam alan (m²)",
    sub: "Dükkan veya mutfağın toplam metrekare tahmini.",
    questionIds: ["q_m2"],
  },
  {
    id: "s3",
    num: "04",
    title: "Konsept / menü seçimi",
    sub: "Ne tür işletme açmak istediğinizi seçin.",
    questionIds: ["q_ust_segment"],
  },
  {
    id: "sfr",
    num: "↳",
    title: "Franchise marka adı",
    sub: "Zincir marka adını girin (opsiyonel).",
    questionIds: ["q_franchise_marka"],
    optional: true,
    showIf: (a) => String(a.q_meslek ?? "") === "Franchise",
  },
  {
    id: "s4",
    num: "05",
    title: "Dükkan türü",
    sub: "İşletme modelinizi seçin.",
    questionIds: ["q_dukkan_turu"],
  },
  {
    id: "s4c",
    num: "↳",
    title: "Servis modeli",
    sub: "Masa, self servis veya paket ağırlığı (opsiyonel).",
    questionIds: ["q_servis_model"],
    optional: true,
  },
  {
    id: "s4b",
    num: "↳",
    title: "Alt tip",
    sub: "Balık veya fast food alt modeli.",
    questionIds: ["q_balik_alt", "q_fast_alt"],
    skipIfEmpty: true,
  },
  {
    id: "s4n",
    num: "↳",
    title: "Ne pişireceksiniz?",
    sub: "Menü hattınızı işaretleyin (birden fazla seçilebilir).",
    questionIds: ["q_ne_pisireceksin"],
  },
  {
    id: "s6",
    num: "06",
    title: "Tahmini tutar",
    sub: "Teklifi oluşturun veya projeyi detaylandırın.",
    questionIds: ["q_karar"],
  },
];

export function panelQuestions(
  panel: LegacyPanelDef,
  questions: WizardQuestion[],
  answers: SoruCevapHaritasi,
): WizardQuestion[] {
  return panel.questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is WizardQuestion => !!q)
    .filter((q) => evaluateGosterIf(q.gosterIf as string | undefined, answers));
}

export function orderedLegacyPanels(
  questions: WizardQuestion[],
  answers: SoruCevapHaritasi,
): LegacyPanelDef[] {
  return LEGACY_PANELS.filter((p) => {
    if (p.showIf && !p.showIf(answers)) return false;
    if (p.skipIfEmpty && panelQuestions(p, questions, answers).length === 0) {
      return false;
    }
    return true;
  });
}

export function getM2MinForAnswers(answers: SoruCevapHaritasi): number {
  return String(answers.q_ust_segment ?? "").trim() === "Bulut Mutfak" ? 8 : 20;
}

export function isM2AnswerValid(answers: SoruCevapHaritasi): boolean {
  const raw = answers.q_m2;
  if (raw === undefined || raw === null || String(raw).trim() === "") return false;
  const n = Number(raw);
  const min = getM2MinForAnswers(answers);
  return Number.isFinite(n) && n >= min && n <= 10000;
}

export function isLegacyPanelComplete(
  panel: LegacyPanelDef,
  questions: WizardQuestion[],
  answers: SoruCevapHaritasi,
): boolean {
  const qs = panelQuestions(panel, questions, answers);
  if (qs.length === 0) return panel.optional === true;
  if (panel.id === "s2") {
    return isAdresFormValid(answersToAdresForm(answers));
  }
  if (panel.id === "s1") {
    return String(answers.q_meslek ?? "").trim().length > 0;
  }
  if (panel.id === "s5") {
    return isM2AnswerValid(answers);
  }
  if (panel.optional && qs.every((q) => q.required === "false")) {
    const needsPick = qs.some(
      (q) =>
        q.type === "select" ||
        q.type === "select_conditional" ||
        q.type === "multi_select",
    );
    if (needsPick) {
      return qs.some((q) => {
        const id = q.id as keyof SoruCevapHaritasi;
        const v = answers[id];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && String(v).trim() !== "";
      });
    }
    return true;
  }
  return qs.every((q) => isQuestionAnswered(q, answers));
}

export function panelAnswerSummary(
  panel: LegacyPanelDef,
  answers: SoruCevapHaritasi,
): string {
  switch (panel.id) {
    case "s1":
      return String(answers.q_meslek ?? "");
    case "s2": {
      const parts = [answers.q_lokasyon, answers.q_acik_adres]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean);
      return parts.join(" · ");
    }
    case "s5":
      return answers.q_m2 ? `${answers.q_m2} m²` : "";
    case "s3":
      return String(answers.q_ust_segment ?? "");
    case "sfr":
      return String(answers.q_franchise_marka ?? "");
    case "s4":
      return String(answers.q_dukkan_turu ?? "");
    case "s4c":
      return String(answers.q_servis_model ?? "");
    case "s4b":
      return String(answers.q_balik_alt ?? answers.q_fast_alt ?? "");
    case "s4n": {
      const v = answers.q_ne_pisireceksin;
      return Array.isArray(v) ? v.join(", ") : String(v ?? "");
    }
    case "s6":
      return String(answers.q_karar ?? "");
    default:
      return "";
  }
}

const DOWNSTREAM_CLEAR: Partial<
  Record<string, (keyof SoruCevapHaritasi)[]>
> = {
  q_meslek: [
    "q_franchise_marka",
    "q_ust_segment",
    "q_dukkan_turu",
    "q_balik_alt",
    "q_fast_alt",
    "q_ne_pisireceksin",
    "q_m2",
    "q_karar",
  ],
  q_lokasyon: ["q_karar"],
  q_acik_adres: ["q_karar"],
  q_m2: ["q_karar"],
  q_ust_segment: [
    "q_dukkan_turu",
    "q_balik_alt",
    "q_fast_alt",
    "q_ne_pisireceksin",
    "q_karar",
  ],
  q_dukkan_turu: [
    "q_servis_model",
    "q_balik_alt",
    "q_fast_alt",
    "q_ne_pisireceksin",
    "q_karar",
  ],
  q_servis_model: ["q_karar"],
  q_balik_alt: ["q_karar"],
  q_fast_alt: ["q_karar"],
  q_ne_pisireceksin: ["q_karar"],
};

export function clearDownstreamAnswers(
  answers: SoruCevapHaritasi,
  changedKey: keyof SoruCevapHaritasi,
): SoruCevapHaritasi {
  const keys = DOWNSTREAM_CLEAR[changedKey];
  if (!keys) return answers;
  const next = { ...answers };
  for (const k of keys) delete next[k];
  return next;
}

export function wizardHint(
  panels: LegacyPanelDef[],
  doneIds: Set<string>,
  activeId: string | null,
): { pct: number; title: string; sub: string } {
  const doneCount = panels.filter((p) => doneIds.has(p.id)).length;
  const pct = Math.min(
    100,
    Math.round(12 + (doneCount / Math.max(panels.length, 1)) * 88),
  );

  if (doneIds.has("s6")) {
    return {
      pct: 100,
      title: "Tebrikler",
      sub: "Teklif özetiniz hazır. Aşağıdan inceleyebilir veya Excel indirebilirsiniz.",
    };
  }
  if (activeId === "s1") {
    return {
      pct,
      title: "Başlayalım",
      sub: "İlk kutudan rolünüzü seçin — kısa bir soru.",
    };
  }
  if (activeId === "s2") {
    return {
      pct,
      title: "Teslimat adresi",
      sub: "İl ve adres bilgisini girin; nakliye tahmini için kullanılır.",
    };
  }
  if (activeId === "s5") {
    return {
      pct,
      title: "Alan (m²)",
      sub: "Toplam metrekareyi yazın veya kaydırıcıdan seçin.",
    };
  }
  if (activeId === "s3" || activeId === "s4" || activeId === "s4b" || activeId === "s4c") {
    return {
      pct,
      title: "Konsept seçimi",
      sub: "Dükkan türü ve varsa ek soruları tamamlayın.",
    };
  }
  if (activeId === "s6") {
    return {
      pct,
      title: "Son adım",
      sub: "Teklifi alın veya detaylandırma tercihinizi seçin.",
    };
  }
  return {
    pct,
    title: "Devam edin",
    sub: "Yukarıdaki soruları sırayla yanıtlayın.",
  };
}
