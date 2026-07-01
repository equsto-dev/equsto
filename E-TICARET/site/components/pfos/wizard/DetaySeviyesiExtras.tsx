"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReferansListeOzet } from "@/lib/pfos/referans/list-referanslar";
import {
  detaySeviyesiFromLabel,
  type DetaySeviyesi,
} from "@/lib/pfos/wizard/detay-seviyesi";
import {
  detayModAciklama,
  konseptBolumM2TeklifeEtki,
  konseptReferansListeModu,
} from "@/lib/pfos/wizard/detay-konsept-mod";
import { mutfakM2FromToplam } from "@/lib/pfos/wizard/m2-dagitim-kurali";
import { dagitM2Toplam, zonesForKonsept } from "@/lib/pfos/wizard/profiles";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

export type DetaySeviyesiState = {
  teshirVitrinleriDahil: boolean;
  bulasikKapasitesiYuksek: boolean;
  referansId: string | null;
  bolumM2: Record<string, number>;
};

type Props = {
  detayLabel: string;
  konsept: string | null;
  m2: number;
  state: DetaySeviyesiState;
  onChange: (patch: Partial<DetaySeviyesiState>) => void;
};

export function defaultDetaySeviyesiState(): DetaySeviyesiState {
  return {
    teshirVitrinleriDahil: true,
    bulasikKapasitesiYuksek: false,
    referansId: null,
    bolumM2: {},
  };
}

export function detaySeviyesiLevelFromLabel(label: string): DetaySeviyesi {
  return detaySeviyesiFromLabel(label);
}

function sumBolum(bolum: Record<string, number>): number {
  return Object.values(bolum).reduce((s, v) => s + (Number(v) || 0), 0);
}

export default function DetaySeviyesiExtras({
  detayLabel,
  konsept,
  m2,
  state,
  onChange,
}: Props) {
  const { t } = usePfosLabel();
  const level = detaySeviyesiFromLabel(detayLabel);
  const [referanslar, setReferanslar] = useState<ReferansListeOzet[]>([]);
  const zones = zonesForKonsept(konsept as Konsept | null);
  const mod = useMemo(() => detayModAciklama(konsept), [konsept]);
  const mutfakHedef = mutfakM2FromToplam(m2);
  const bolumToplam = sumBolum(state.bolumM2);
  const zoneTeklifeEtki = konseptBolumM2TeklifeEtki(konsept);
  const referansMod = konseptReferansListeModu(konsept);

  useEffect(() => {
    if (level !== "detayli" || !konsept) {
      setReferanslar([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/pfos/referanslar?konsept=${encodeURIComponent(konsept)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          referanslar?: ReferansListeOzet[];
        };
        if (!cancelled && res.ok && Array.isArray(data.referanslar)) {
          setReferanslar(data.referanslar);
        }
      } catch {
        if (!cancelled) setReferanslar([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [level, konsept]);

  if (level === "hizli") return null;

  return (
    <div className={styles.detayPanel}>
      <p className={styles.detayPanelLead}>
        <b>{t("Teklif nasıl üretilir?")}</b> {t(mod.ozet)}
      </p>

      <p className={styles.detayPanelSub}>{t("Ek tercihler")}</p>
      <div className={styles.detayCheckGrid}>
        <label
          className={`${styles.detayCheck}${state.teshirVitrinleriDahil ? ` ${styles.detayCheckSelected}` : ""}`}
        >
          <input
            type="checkbox"
            checked={state.teshirVitrinleriDahil}
            onChange={(e) =>
              onChange({ teshirVitrinleriDahil: e.target.checked })
            }
          />
          {t("Teşhir vitrinleri dahil")}
        </label>
        <label
          className={`${styles.detayCheck}${state.bulasikKapasitesiYuksek ? ` ${styles.detayCheckSelected}` : ""}`}
        >
          <input
            type="checkbox"
            checked={state.bulasikKapasitesiYuksek}
            onChange={(e) =>
              onChange({ bulasikKapasitesiYuksek: e.target.checked })
            }
          />
          {t("Yüksek bulaşık kapasitesi")}
        </label>
      </div>

      {level === "detayli" && referanslar.length > 0 ? (
        <>
          <p className={styles.detayPanelSub}>{t("Referans proje")}</p>
          <div className={styles.detayChipGrid}>
            <button
              type="button"
              className={`${styles.detayChip}${!state.referansId ? ` ${styles.detayChipSelected}` : ""}`}
              onClick={() => onChange({ referansId: null })}
            >
              <span className={styles.detayChipMark}>
                {!state.referansId ? "✓" : ""}
              </span>
              {t("Otomatik (m² bandı)")}
            </button>
            {referanslar.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`${styles.detayChip}${state.referansId === r.id ? ` ${styles.detayChipSelected}` : ""}`}
                onClick={() => onChange({ referansId: r.id })}
              >
                <span className={styles.detayChipMark}>
                  {state.referansId === r.id ? "✓" : ""}
                </span>
                {r.label}
                {r.referansM2 ? ` · ${r.referansM2} m²` : ""}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {level === "detayli" && referansMod && referanslar.length === 0 ? (
        <p className={styles.detayPanelLead} style={{ marginTop: "0.75rem" }}>
          {t(
            "Bu konsept için referans seçimi API'de yok; teklif otomatik m² bandından seçilir (ör. steakhouse 80–150 / 150–250 m²).",
          )}
        </p>
      ) : null}

      {level === "detayli" && zones.length > 0 && m2 >= 20 ? (
        <>
          <p className={styles.detayPanelSub}>
            {zoneTeklifeEtki
              ? t("Bölüm m²")
              : t("Bölüm m² (planlama — teklife yansımaz)")}
          </p>
          <p className={styles.detayPanelLead}>
            {t("Toplam")} {m2} m² →{" "}
            <b>
              {t("mutfak hedefi")} {mutfakHedef} m²
            </b>{" "}
            ({t("toplam alanın 1/3'ü")}).{" "}
            {zoneTeklifeEtki
              ? t("Dağıtım zone kataloğuna bağlanır.")
              : t(
                  "Steakhouse vb. konseptlerde liste referans dosyasından gelir; aşağıdaki rakamlar yerleşim taslağı içindir.",
                )}
          </p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.detayPanelBtn}`}
            onClick={() => {
              const dagit = dagitM2Toplam(zones, m2, konsept as Konsept);
              onChange({ bolumM2: dagit });
            }}
          >
            {t("Kurala göre dağıt")}
          </button>
          <div className={styles.detayCheckGrid}>
            {zones.map((z) => (
              <label key={z} className={styles.detayCheck}>
                <span style={{ flex: 1 }}>{zoneLabel(z)}</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={state.bolumM2[z] ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    onChange({
                      bolumM2: {
                        ...state.bolumM2,
                        [z]: Number.isFinite(n) && n >= 0 ? n : 0,
                      },
                    });
                  }}
                  style={{ width: 72 }}
                />
              </label>
            ))}
          </div>
          {bolumToplam > 0 ? (
            <p
              className={styles.detayPanelLead}
              style={{
                color:
                  Math.abs(bolumToplam - mutfakHedef) <= 2 ? "#2d7a2d" : "#b36b00",
              }}
            >
              {t("Bölüm toplamı")}: {bolumToplam} m² · {t("mutfak hedefi")}:{" "}
              {mutfakHedef} m²
              {Math.abs(bolumToplam - mutfakHedef) > 2
                ? ` · ${t("fark")}: ${bolumToplam - mutfakHedef > 0 ? "+" : ""}${bolumToplam - mutfakHedef} m²`
                : ""}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
