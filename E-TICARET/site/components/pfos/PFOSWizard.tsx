"use client";

import { useState, useEffect, useCallback } from "react";
import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import {
  adresOzeti,
  parseM2,
  type PfosWizardState,
} from "@/lib/pfos/wizard/types";
import { dagitM2Toplam, zonesForKonsept } from "@/lib/pfos/wizard/profiles";
import PFOSStepNav from "./PFOSStepNav";
import AdresStep from "./steps/AdresStep";
import KonseptStep from "./steps/KonseptStep";
import type { KonseptMeta } from "@/lib/pfos/wizard/types";
import BolumM2Step from "./steps/BolumM2Step";
import TeklifSonucu from "./TeklifSonucu";
import TeklifV14Onizleme from "./TeklifV14Onizleme";
import { parseConceptsResponse } from "@/lib/pfos/wizard/parse-concepts";
import { pfosWizardInitialState } from "@/lib/pfos/wizard/quick-mode";
import { pfosS } from "./pfos-styles";

const INITIAL = pfosWizardInitialState();

export default function PFOSWizard() {
  const [state, setState] = useState<PfosWizardState>(INITIAL);
  const [konseptler, setKonseptler] = useState<KonseptMeta[]>([]);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pfos/concepts", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        const list = parseConceptsResponse(data);
        if (!list.length) {
          const alt = await fetch("/api/pfos?action=concepts", {
            cache: "no-store",
          });
          const altData = await alt.json();
          if (!cancelled) {
            const list2 = parseConceptsResponse(altData);
            setKonseptler(list2);
            if (!list2.length) {
              setHata("Konsept listesi boş — API yanıtını kontrol edin.");
            }
          }
          return;
        }
        setKonseptler(list);
      } catch {
        if (!cancelled) setHata("Konseptler yüklenemedi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(
    (patch: Partial<PfosWizardState>) =>
      setState((s) => ({ ...s, ...patch })),
    [],
  );

  const seciliKonsept = Array.isArray(konseptler)
    ? konseptler.find((k) => k.konsept === state.konsept)
    : undefined;

  function handleM2Toplam(v: number | string) {
    const toplam = parseM2(v);
    const zones = zonesForKonsept(state.konsept);
    if (toplam > 0 && zones.length) {
      set({
        m2Toplam: v,
        bolumM2: { ...state.bolumM2, ...dagitM2Toplam(zones, toplam, state.konsept) },
      });
      return;
    }
    set({ m2Toplam: v });
  }

  function handleKonsept(k: Konsept) {
    const toplam = parseM2(state.m2Toplam);
    const zones = zonesForKonsept(k);
    const bolumM2 =
      toplam > 0 && zones.length
        ? dagitM2Toplam(zones, toplam, k)
        : {};
    set({ konsept: k, bolumM2 });
  }

  function handleDagit() {
    const toplam = parseM2(state.m2Toplam);
    const zones = zonesForKonsept(state.konsept);
    if (toplam > 0 && zones.length) {
      set({
        bolumM2: {
          ...state.bolumM2,
          ...dagitM2Toplam(zones, toplam, state.konsept),
        },
      });
    }
  }

  function bolumM2Sayilar(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [z, v] of Object.entries(state.bolumM2)) {
      const n = parseM2(v);
      if (n > 0) out[z] = n;
    }
    return out;
  }

  async function teklifOlustur() {
    if (!state.konsept) return;
    const m2 = parseM2(state.m2Toplam);
    if (m2 < 30) return;

    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/pfos/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konsept: state.konsept,
          m2,
          sehir: state.adres.il,
          lokasyon: state.lokasyon,
          bolumM2: bolumM2Sayilar(),
          teslimatAdresi: adresOzeti(state.adres),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Sunucu hatası",
        );
      }
      const data: PFOSResponse = await res.json();
      setSonuc(data);
      setTeklifV14(
        pfosResponseToTeklifV14(data, {
          projeAdi: data.konseptLabel,
          teslimatAdresi: adresOzeti(state.adres),
          bolumM2: data.bolumM2 ?? bolumM2Sayilar(),
        }),
      );
      set({ adim: 4 });
    } catch (e: unknown) {
      setHata(e instanceof Error ? e.message : "Teklif oluşturulamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  function yeniTeklif() {
    setSonuc(null);
    setTeklifV14(null);
    setState(INITIAL);
    setHata(null);
  }

  if (state.adim === 4 && sonuc && teklifV14) {
    return (
      <div>
        <PFOSStepNav adim={4} />
        <div style={pfosS.sonucUst}>
          <button type="button" style={pfosS.geri} onClick={yeniTeklif}>
            ← Yeni Teklif
          </button>
        </div>
        <TeklifV14Onizleme model={teklifV14} />
        <details style={{ marginTop: 32 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "#666" }}>
            Kategori özeti (geçiş dönemi)
          </summary>
          <TeklifSonucu sonuc={sonuc} />
        </details>
      </div>
    );
  }

  return (
    <div>
      <PFOSStepNav adim={Math.min(state.adim, 3)} />
      {state.adim === 0 && (
        <AdresStep
          adres={state.adres}
          lokasyon={state.lokasyon}
          onAdres={(p) => set({ adres: { ...state.adres, ...p } })}
          onLokasyon={(lokasyon) => set({ lokasyon })}
          onDevam={() => set({ adim: 1 })}
        />
      )}
      {state.adim === 1 && (
        <KonseptStep
          konseptler={konseptler}
          secili={state.konsept}
          onSec={handleKonsept}
          onGeri={() => set({ adim: 0 })}
          onDevam={() => set({ adim: 2 })}
        />
      )}
      {state.adim === 2 && state.konsept && (
        <BolumM2Step
          konsept={state.konsept}
          m2Toplam={state.m2Toplam}
          bolumM2={state.bolumM2}
          m2Min={seciliKonsept?.m2Min}
          m2Max={seciliKonsept?.m2Max}
          hata={hata}
          yukleniyor={yukleniyor}
          onM2Toplam={handleM2Toplam}
          onBolumM2={(zone, v) =>
            set({
              bolumM2: { ...state.bolumM2, [zone]: v },
            })
          }
          onDagit={handleDagit}
          onGeri={() => set({ adim: 1 })}
          onTeklif={teklifOlustur}
        />
      )}
    </div>
  );
}
