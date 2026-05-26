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

export function dukkanSecenekleri(
  q: WizardQuestion,
  answers: SoruCevapHaritasi,
): string[] {
  if (q.type === "select_conditional" && q.branches) {
    const seg = String(answers.q_ust_segment ?? "");
    const branches = q.branches as Record<string, string[]>;
    const opts = branches[seg] ?? branches.Bilmiyorum ?? [];
    return filtreBulutDukkanSecenekleri(opts, answers);
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
    return Number.isFinite(n) && n >= 20;
  }
  return v !== undefined && v !== null && String(v).trim() !== "";
}

export function defaultPublicQuestions(): WizardQuestion[] {
  return DEFAULT_WIZARD_QUESTIONS as WizardQuestion[];
}
