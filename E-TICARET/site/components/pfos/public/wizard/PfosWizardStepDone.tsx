"use client";

import stepStyles from "./pfos-wizard-step.module.css";

type Props = {
  label: string;
  answer: string;
  onClick: () => void;
};

export default function PfosWizardStepDone({ label, answer, onClick }: Props) {
  return (
    <button type="button" className={stepStyles.doneRow} onClick={onClick}>
      <span className={stepStyles.doneCheck} aria-hidden>
        ✓
      </span>
      <span className={stepStyles.doneLabel}>{label}</span>
      <span className={stepStyles.doneAnswer}>{answer}</span>
    </button>
  );
}
