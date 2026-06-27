"use client";

import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import ws from "./pfos-workspace.module.css";

type Props = {
  activePane: "balanced" | "wizard" | "liste";
  onWizardClick: () => void;
  onListeClick: () => void;
  wizardPct?: number;
  listeHasResult?: boolean;
};

export default function PfosLeftRail({
  activePane,
  onWizardClick,
  onListeClick,
  wizardPct = 0,
  listeHasResult = false,
}: Props) {
  const { t } = usePfosLabel();

  return (
    <aside className={ws.leftRail} aria-label={t("Modüller")}>
      <button
        type="button"
        className={`${ws.railBtn}${activePane === "wizard" ? ` ${ws.railBtnActive}` : ""}`}
        aria-current={activePane === "wizard" ? "page" : undefined}
        title={t("Konsept sihirbazı")}
        onClick={onWizardClick}
      >
        <span className={ws.railBtnIcon} aria-hidden>
          ◆
        </span>
        <span className={ws.railBtnHint}>{t("Konsept")}</span>
        {wizardPct > 0 && activePane === "wizard" ? (
          <span className={ws.railBtnBadge}>{wizardPct}%</span>
        ) : null}
      </button>
      <button
        type="button"
        className={`${ws.railBtn}${activePane === "liste" ? ` ${ws.railBtnActive}` : ""}`}
        aria-current={activePane === "liste" ? "page" : undefined}
        title={t("Liste yükle")}
        onClick={onListeClick}
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
