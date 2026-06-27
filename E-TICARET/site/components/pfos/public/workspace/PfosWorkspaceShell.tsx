"use client";

import type { ReactNode } from "react";
import PfosLeftRail from "./PfosLeftRail";
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
  onWizardClick: () => void;
  onListeClick: () => void;
  pipelineSteps: PipelineStep[];
  pipelineActive: PipelineStageId;
  summary: LiveSummaryData;
  wizardPct?: number;
  listeHasResult?: boolean;
  children: ReactNode;
};

export default function PfosWorkspaceShell({
  activePane,
  onWizardClick,
  onListeClick,
  pipelineSteps,
  pipelineActive,
  summary,
  wizardPct = 0,
  listeHasResult = false,
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
        <PfosLeftRail
          activePane={activePane}
          onWizardClick={onWizardClick}
          onListeClick={onListeClick}
          wizardPct={wizardPct}
          listeHasResult={listeHasResult}
        />
        <main className={ws.center} aria-label="Çalışma alanı">
          {children}
        </main>
        {showSummary ? <PfosLiveSummary data={summary} /> : null}
      </div>
    </div>
  );
}
