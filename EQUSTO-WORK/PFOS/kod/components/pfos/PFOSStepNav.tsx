"use client";

import { PFOS_WIZARD_ADIMLAR } from "@/lib/pfos/wizard/types";
import { pfosS } from "./pfos-styles";

type Props = {
  adim: number;
  maxAdim?: number;
};

export default function PFOSStepNav({ adim, maxAdim = 3 }: Props) {
  return (
    <nav style={pfosS.stepNav} aria-label="PFOS adımları">
      {PFOS_WIZARD_ADIMLAR.map((step, i) => {
        const done = i < adim;
        const active = i === adim;
        return (
          <span
            key={step.key}
            style={{
              ...pfosS.stepPill,
              ...(active ? pfosS.stepPillActive : {}),
              ...(done ? pfosS.stepPillDone : {}),
            }}
          >
            {i + 1}. {step.label}
          </span>
        );
      })}
      {adim > maxAdim && (
        <span style={{ ...pfosS.stepPill, ...pfosS.stepPillActive }}>
          Teklif
        </span>
      )}
    </nav>
  );
}
