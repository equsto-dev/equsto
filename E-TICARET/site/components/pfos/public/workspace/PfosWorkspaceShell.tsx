"use client";

import type { ReactNode } from "react";
import PfosLiveSummary from "./PfosLiveSummary";
import PfosPipeline from "./PfosPipeline";
import type {
  LiveSummaryData,
  PipelineStageId,
  PipelineStep,
} from "./pfos-workspace.types";
import ws from "./pfos-workspace.module.css";

type Props = {
  activePane: "balanced" | "wizard" | "liste";
  pipelineSteps: PipelineStep[];
  pipelineActive: PipelineStageId;
  summary: LiveSummaryData;
  children: ReactNode;
};

export default function PfosWorkspaceShell({
  activePane,
  pipelineSteps,
  pipelineActive,
  summary,
  children,
}: Props) {
  const showSummary = activePane !== "balanced";

  return (
    <div className={ws.shell} data-pfos-workspace="">
      <PfosPipeline steps={pipelineSteps} activeId={pipelineActive} />
      <div
        className={[ws.grid, !showSummary ? ws.gridNoSummary : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <main className={ws.center} aria-label="Çalışma alanı">
          {children}
        </main>
        {showSummary ? <PfosLiveSummary data={summary} /> : null}
      </div>
    </div>
  );
}
