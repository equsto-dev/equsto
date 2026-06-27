"use client";

import type { PipelineStageId, PipelineStep } from "./pfos-workspace.types";
import ws from "./pfos-workspace.module.css";

type Props = {
  steps: PipelineStep[];
  activeId: PipelineStageId;
};

function stepIndex(steps: PipelineStep[], id: PipelineStageId): number {
  const i = steps.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}

export default function PfosPipeline({ steps, activeId }: Props) {
  const activeIdx = stepIndex(steps, activeId);

  return (
    <nav className={ws.pipeline} aria-label="Proje aşamaları">
      <ol className={ws.pipelineTrack}>
        {steps.map((step, i) => {
          const done = i < activeIdx;
          const active = step.id === activeId;
          const upcoming = i > activeIdx;
          return (
            <li
              key={step.id}
              className={[
                ws.pipelineStep,
                done ? ws.pipelineStepDone : "",
                active ? ws.pipelineStepActive : "",
                upcoming ? ws.pipelineStepUpcoming : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {i > 0 ? (
                <span
                  className={ws.pipelineConnector}
                  aria-hidden
                  data-filled={done || active ? "true" : "false"}
                />
              ) : null}
              <span className={ws.pipelineDot} aria-hidden />
              <span className={ws.pipelineLabel}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
