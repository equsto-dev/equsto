"use client";

import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import { PROFIL_BY_SLUG } from "@/lib/pfos/wizard/profiles";
import { pfosS } from "../pfos-styles";

import type { KonseptMeta } from "@/lib/pfos/wizard/types";

export type { KonseptMeta };

type Props = {
  konseptler: KonseptMeta[];
  secili: Konsept | null;
  onSec: (k: Konsept) => void;
  onGeri: () => void;
  onDevam: () => void;
};

export default function KonseptStep({
  konseptler,
  secili,
  onSec,
  onGeri,
  onDevam,
}: Props) {
  const profil = secili ? PROFIL_BY_SLUG[secili] : null;

  return (
    <div style={pfosS.panel}>
      <button type="button" style={pfosS.geri} onClick={onGeri}>
        ← Geri
      </button>
      <h2 style={pfosS.baslik}>İşletme konsepti</h2>
      <p style={pfosS.alt}>
        Konsept seçimi; mutfak bölümleri ve ekipman şablonunu belirler (tek PFOS
        motoru).
      </p>

      {konseptler.length === 0 ? (
        <p style={pfosS.bilgi}>Konseptler yükleniyor…</p>
      ) : (
        <div style={pfosS.grid3}>
          {konseptler.map((k) => (
            <button
              key={k.konsept}
              type="button"
              style={{
                ...pfosS.kart,
                ...(secili === k.konsept ? pfosS.secili : {}),
              }}
              onClick={() => onSec(k.konsept as Konsept)}
            >
              <div style={pfosS.kartBaslik}>{k.label}</div>
              <div style={pfosS.kartAlt}>
                {k.ornekler.slice(0, 2).join(" · ")}
              </div>
              <div style={pfosS.kartMeta}>
                {k.m2Min}–{k.m2Max} m² · {k.zorunluSayisi} zorunlu kalem
              </div>
            </button>
          ))}
        </div>
      )}

      {profil && (
        <p style={{ ...pfosS.ipucu, marginBottom: 16 }}>
          Profil: {profil.konseptUst} · {profil.dukkan} —{" "}
          {profil.pfosZones.length} mutfak bölümü
        </p>
      )}

      {secili && (
        <button type="button" style={pfosS.devam} onClick={onDevam}>
          Devam — Alan & bölümler →
        </button>
      )}
    </div>
  );
}
