"use client";

import type { ReactNode } from "react";
import stepStyles from "./pfos-wizard-step.module.css";

type Props = {
  introLines?: string[];
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSkip?: () => void;
  skipLabel?: string;
  entering?: boolean;
  revealing?: boolean;
};

export default function PfosWizardStepSurface({
  introLines,
  title,
  subtitle,
  children,
  onSkip,
  skipLabel = "Atla →",
  entering = false,
  revealing = false,
}: Props) {
  return (
    <div
      className={`${stepStyles.surface}${entering ? ` ${stepStyles.surfacePending}` : ""}${revealing ? ` ${stepStyles.surfaceReveal}` : ""}`}
    >
      {introLines && introLines.length > 0 ? (
        <div className={stepStyles.introBlock}>
          {introLines.map((line, i) => (
            <p
              key={line}
              className={
                i === 0 ? stepStyles.introLineStrong : stepStyles.introLine
              }
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
      <h2 className={stepStyles.surfaceTitle}>{title}</h2>
      {subtitle ? <p className={stepStyles.surfaceSub}>{subtitle}</p> : null}
      <div className={stepStyles.surfaceBody}>{children}</div>
      {onSkip ? (
        <button type="button" className={stepStyles.skipLink} onClick={onSkip}>
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}
