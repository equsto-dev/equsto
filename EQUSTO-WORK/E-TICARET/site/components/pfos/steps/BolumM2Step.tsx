"use client";

import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import {
  dagitM2Toplam,
  zonesForKonsept,
} from "@/lib/pfos/wizard/profiles";
import { parseM2 } from "@/lib/pfos/wizard/types";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import { pfosS } from "../pfos-styles";

type Props = {
  konsept: Konsept;
  m2Toplam: number | string;
  bolumM2: Record<string, number | string>;
  m2Min?: number;
  m2Max?: number;
  hata: string | null;
  yukleniyor: boolean;
  onM2Toplam: (v: number | string) => void;
  onBolumM2: (zone: string, v: number | string) => void;
  onDagit: () => void;
  onGeri: () => void;
  onTeklif: () => void;
};

function sumBolum(bolum: Record<string, number | string>): number {
  return Object.values(bolum).reduce<number>((s, v) => s + parseM2(v), 0);
}

export default function BolumM2Step({
  konsept,
  m2Toplam,
  bolumM2,
  m2Min,
  m2Max,
  hata,
  yukleniyor,
  onM2Toplam,
  onBolumM2,
  onDagit,
  onGeri,
  onTeklif,
}: Props) {
  const zones = zonesForKonsept(konsept);
  const toplam = parseM2(m2Toplam);
  const bolumToplam = sumBolum(bolumM2);
  const fark = toplam > 0 ? toplam - bolumToplam : 0;
  const ok = toplam >= 30 && (bolumToplam === 0 || Math.abs(fark) < 1);

  return (
    <div style={pfosS.panel}>
      <button type="button" style={pfosS.geri} onClick={onGeri}>
        ← Geri
      </button>
      <h2 style={pfosS.baslik}>Alan ve mutfak bölümleri</h2>
      <p style={pfosS.alt}>
        Toplam m² girin; her mutfak bölümü için alanı ayrı belirleyin. Motor
        her bölümün m²’sine göre ekipman adedini hesaplar.
        {m2Min != null && m2Max != null && (
          <span style={pfosS.ipucu}>
            {" "}
            Önerilen: {m2Min}–{m2Max} m²
          </span>
        )}
      </p>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket} htmlFor="pf-m2-toplam">
          Toplam alan (m²)
        </label>
        <input
          id="pf-m2-toplam"
          type="number"
          style={pfosS.input}
          min={30}
          max={2000}
          value={m2Toplam}
          onChange={(e) => onM2Toplam(e.target.value)}
        />
      </div>

      {zones.length > 0 && toplam > 0 && (
        <div style={pfosS.bolumListe}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>Bölüm m²</span>
            <button
              type="button"
              style={{
                ...pfosS.radyo,
                fontSize: 12,
                padding: "6px 12px",
              }}
              onClick={onDagit}
            >
              Toplamı bölümlere eşit dağıt
            </button>
          </div>
          {zones.map((z) => (
            <div key={z} style={pfosS.bolumSatir}>
              <label style={{ fontSize: 13 }} htmlFor={`pf-zone-${z}`}>
                {zoneLabel(z)}
              </label>
              <input
                id={`pf-zone-${z}`}
                type="number"
                style={{ ...pfosS.input, textAlign: "right" }}
                min={0}
                max={2000}
                value={bolumM2[z] ?? ""}
                onChange={(e) => onBolumM2(z, e.target.value)}
              />
            </div>
          ))}
          {bolumToplam > 0 && (
            <p
              style={{
                fontSize: 12,
                color: Math.abs(fark) < 1 ? "#2d7a2d" : "#b36b00",
                marginTop: 8,
              }}
            >
              Bölüm toplamı: {bolumToplam} m²
              {Math.abs(fark) >= 1 &&
                ` · Toplamdan fark: ${fark > 0 ? "+" : ""}${fark} m²`}
            </p>
          )}
        </div>
      )}

      {hata && <p style={pfosS.hata}>{hata}</p>}

      <button
        type="button"
        style={{ ...pfosS.devam, ...(!ok || yukleniyor ? pfosS.pasif : {}) }}
        disabled={!ok || yukleniyor}
        onClick={onTeklif}
      >
        {yukleniyor ? "Teklif oluşturuluyor…" : "Teklif oluştur →"}
      </button>
    </div>
  );
}
