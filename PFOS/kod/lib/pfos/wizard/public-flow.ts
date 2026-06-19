import type { SoruCevapHaritasi } from "@/lib/pfos/proje-akis/soru-motor-mapping";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";
import { filtreBulutDukkanSecenekleri } from "@/lib/pfos/wizard/bulut-mutfak-kompakt";

export type WizardQuestion = Record<string, unknown> & {
  id: string;
  step?: string;
  text?: string;
  type?: string;
  required?: string;
  options?: string[];
  branches?: Record<string, string[]>;
  gosterIf?: string;
  note?: string;
};

const STEP_RANK: Record<string, number> = {
  "01": 10,
  "1": 10,
  "02": 15,
  "2": 15,
  "03": 20,
  "3": 20,
  "3f": 25,
  "04": 30,
  "4": 30,
  "4a": 35,
  "4b": 36,
  "4c": 37,
  "3E": 40,
  "05": 50,
  "5": 50,
  "5A": 55,
  "5B": 56,
  "06": 60,
  "6": 60,
};

function m2MinForAnswers(answers: SoruCevapHaritasi): number {
  return String(answers.q_ust_segment ?? "").trim() === "Bulut Mutfak" ? 8 : 20;
}

export function sortWizardQuestions(list: WizardQuestion[]): WizardQuestion[] {
  return [...list].sort((a, b) => {
    const sa = STEP_RANK[String(a.step ?? "")] ?? 999;
    const sb = STEP_RANK[String(b.step ?? "")] ?? 999;
    if (sa !== sb) return sa - sb;
    return String(a.id).localeCompare(String(b.id), "tr");
  });
}

export function evaluateGosterIf(
  gosterIf: string | undefined,
  answers: SoruCevapHaritasi,
): boolean {
  if (!gosterIf) return true;
  const eq = gosterIf.indexOf("=");
  if (eq >= 0) {
    const key = gosterIf.slice(0, eq).trim();
    const want = gosterIf.slice(eq + 1).trim();
    return String(answers[key as keyof SoruCevapHaritasi] ?? "") === want;
  }
  const v = answers[gosterIf as keyof SoruCevapHaritasi];
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && String(v).trim() !== "";
}

export function visibleWizardQuestions(
  questions: WizardQuestion[],
  answers: SoruCevapHaritasi,
): WizardQuestion[] {
  return sortWizardQuestions(questions).filter((q) =>
    evaluateGosterIf(q.gosterIf as string | undefined, answers),
  );
}

export type M2DukkanBand = { min: number; max: number };

export function filtreDukkanSecenekleriM2(
  opts: string[],
  answers: SoruCevapHaritasi,
  m2ByDukkan: Record<string, M2DukkanBand>,
): string[] {
  const m2 = Number(answers.q_m2);
  if (!Number.isFinite(m2) || m2 <= 0 || !Object.keys(m2ByDukkan).length) {
    return opts;
  }
  const filtered = opts.filter((opt) => {
    if (opt === "Bilmiyorum") return false;
    const band =
      m2ByDukkan[opt] ??
      (opt === "Restoran" ? m2ByDukkan["Büyük Restoran"] : undefined);
    if (!band) return true;
    return m2 >= band.min && m2 <= band.max;
  });
  return filtered.length ? filtered : opts;
}

export function dukkanSecenekleri(
  q: WizardQuestion,
  answers: SoruCevapHaritasi,
  m2ByDukkan?: Record<string, M2DukkanBand>,
): string[] {
  if (q.type === "select_conditional" && q.branches) {
    const seg = String(answers.q_ust_segment ?? "");
    const branches = q.branches as Record<string, string[]>;
    const opts = (branches[seg] ?? []).filter((o) => o !== "Bilmiyorum");
    const bulut = filtreBulutDukkanSecenekleri(opts, answers);
    const filtered = m2ByDukkan
      ? filtreDukkanSecenekleriM2(bulut, answers, m2ByDukkan)
      : bulut;
    return filtered.filter((o) => o !== "Bilmiyorum");
  }
  return (q.options as string[]) ?? [];
}

export function isQuestionAnswered(
  q: WizardQuestion,
  answers: SoruCevapHaritasi,
): boolean {
  const id = q.id as keyof SoruCevapHaritasi;
  const required = q.required !== "false";
  const v = answers[id];
  if (!required) return true;
  if (q.type === "multi_select") {
    return Array.isArray(v) && v.length > 0;
  }
  if (q.type === "number") {
    const n = Number(v);
    const min = id === "q_m2" ? m2MinForAnswers(answers) : 20;
    return Number.isFinite(n) && n >= min;
  }
  return v !== undefined && v !== null && String(v).trim() !== "";
}

export function defaultPublicQuestions(): WizardQuestion[] {
  return DEFAULT_WIZARD_QUESTIONS as WizardQuestion[];
}

/** API’den gelen eksik/bozuk soru setine karşı — zorunlu PFOS adımları korunur */
const BILMIYORUM_KALDIR_IDS = new Set(["q_karar", "q_ust_segment"]);

function stripBilmiyorumBranches(
  branches: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, vals] of Object.entries(branches)) {
    if (k === "Bilmiyorum") continue;
    const filtered = vals.filter((o) => o !== "Bilmiyorum");
    if (filtered.length) out[k] = filtered;
  }
  return out;
}

function stripBilmiyorum(q: WizardQuestion): WizardQuestion {
  if (q.id === "q_dukkan_turu" && q.branches) {
    return {
      ...q,
      branches: stripBilmiyorumBranches(
        q.branches as Record<string, string[]>,
      ),
    };
  }
  if (!BILMIYORUM_KALDIR_IDS.has(q.id) || !Array.isArray(q.options)) return q;
  return {
    ...q,
    options: q.options.filter((o) => o !== "Bilmiyorum"),
  };
}

/** API eksik/bozuk seçenek gönderirse varsayılan listeyi koru */
const OPTIONS_PREFER_DEFAULT_IDS = new Set(["q_ust_segment"]);

function mergeWizardQuestion(
  base: WizardQuestion | undefined,
  q: WizardQuestion,
): WizardQuestion {
  if (!base) return stripBilmiyorum(q);
  const merged: WizardQuestion = { ...base, ...q };
  if (
    OPTIONS_PREFER_DEFAULT_IDS.has(q.id) &&
    Array.isArray(base.options) &&
    Array.isArray(q.options) &&
    q.options.length < base.options.length
  ) {
    merged.options = base.options;
  }
  return stripBilmiyorum(merged);
}

export function mergePublicWizardQuestions(
  fromApi: WizardQuestion[],
): WizardQuestion[] {
  const defaults = defaultPublicQuestions();
  const byId = new Map<string, WizardQuestion>();
  for (const q of defaults) byId.set(q.id, q);
  for (const q of fromApi) {
    if (!q?.id) continue;
    byId.set(q.id, mergeWizardQuestion(byId.get(q.id), q));
  }
  return sortWizardQuestions([...byId.values()].map(stripBilmiyorum));
}
