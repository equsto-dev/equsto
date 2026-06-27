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
  return (
    <div className={ws.shell} data-pfos-workspace="">
      <PfosPipeline steps={pipelineSteps} activeId={pipelineActive} />
      <div className={ws.grid}>
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
        <PfosLiveSummary data={summary} />
      </div>
    </div>
  );
}
