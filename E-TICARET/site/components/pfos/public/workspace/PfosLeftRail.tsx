"use client";

import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import type { WorkspaceMode } from "./pfos-workspace.types";
import ws from "./pfos-workspace.module.css";

type Props = {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  wizardPct?: number;
  listeHasResult?: boolean;
};

export default function PfosLeftRail({
  mode,
  onModeChange,
  wizardPct = 0,
  listeHasResult = false,
}: Props) {
  const { t } = usePfosLabel();

  return (
    <aside className={ws.leftRail} aria-label={t("Modüller")}>
      <button
        type="button"
        className={`${ws.railBtn}${mode === "wizard" ? ` ${ws.railBtnActive}` : ""}`}
        aria-current={mode === "wizard" ? "page" : undefined}
        title={t("Konsept sihirbazı")}
        onClick={() => onModeChange("wizard")}
      >
        <span className={ws.railBtnIcon} aria-hidden>
          ◆
        </span>
        <span className={ws.railBtnHint}>{t("Konsept")}</span>
        {wizardPct > 0 && mode === "wizard" ? (
          <span className={ws.railBtnBadge}>{wizardPct}%</span>
        ) : null}
      </button>
      <button
        type="button"
        className={`${ws.railBtn}${mode === "liste" ? ` ${ws.railBtnActive}` : ""}`}
        aria-current={mode === "liste" ? "page" : undefined}
        title={t("Liste yükle")}
        onClick={() => onModeChange("liste")}
      >
        <span className={ws.railBtnIcon} aria-hidden>
          ▤
        </span>
        <span className={ws.railBtnHint}>{t("Liste")}</span>
        {listeHasResult ? <span className={ws.railBtnDot} aria-hidden /> : null}
      </button>
    </aside>
  );
}
