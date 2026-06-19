"use client";

import type { PfosAdres, PfosLokasyon } from "@/lib/pfos/wizard/types";
import { pfosS } from "../pfos-styles";

const ILLER = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Mersin",
  "Kayseri",
  "Diyarbakır",
  "Samsun",
  "Trabzon",
  "Eskişehir",
  "Muğla",
  "Kocaeli",
];

type Props = {
  adres: PfosAdres;
  lokasyon: PfosLokasyon;
  onAdres: (patch: Partial<PfosAdres>) => void;
  onLokasyon: (l: PfosLokasyon) => void;
  onDevam: () => void;
};

export default function AdresStep({
  adres,
  lokasyon,
  onAdres,
  onLokasyon,
  onDevam,
}: Props) {
  const ok = Boolean(adres.il?.trim());

  return (
    <div style={pfosS.panel}>
      <h2 style={pfosS.baslik}>Teslimat adresi</h2>
      <p style={pfosS.alt}>
        Önce <b>il</b> seçin; ilçe, mahalle ve caddeyi girin. Nakliye ve montaj
        tahmini için kullanılır. (Adres API — ilçe/mahalle autocomplete Faz 4)
      </p>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket}>İl</label>
        <div style={pfosS.grid2}>
          {ILLER.map((il) => (
            <button
              key={il}
              type="button"
              style={{
                ...pfosS.kart,
                ...(adres.il === il ? pfosS.secili : {}),
              }}
              onClick={() => onAdres({ il })}
            >
              {il}
            </button>
          ))}
        </div>
      </div>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket} htmlFor="pf-ilce">
          İlçe
        </label>
        <input
          id="pf-ilce"
          className="pfos-input"
          style={pfosS.input}
          placeholder="Listeden seçin veya yazın"
          value={adres.ilce}
          onChange={(e) => onAdres({ ilce: e.target.value })}
          autoComplete="address-level2"
        />
      </div>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket} htmlFor="pf-mahalle">
          Mahalle
        </label>
        <input
          id="pf-mahalle"
          style={pfosS.input}
          placeholder="Mahalle"
          value={adres.mahalle}
          onChange={(e) => onAdres({ mahalle: e.target.value })}
          autoComplete="address-level3"
        />
      </div>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket} htmlFor="pf-cadde">
          Cadde / sokak
        </label>
        <input
          id="pf-cadde"
          style={pfosS.input}
          placeholder="Cadde adı"
          value={adres.cadde}
          onChange={(e) => onAdres({ cadde: e.target.value })}
          autoComplete="street-address"
        />
      </div>

      <div style={pfosS.alan}>
        <label style={pfosS.etiket}>Lokasyon tipi</label>
        <div style={pfosS.radyoGrup}>
          {(["cadde", "avm"] as const).map((lok) => (
            <button
              key={lok}
              type="button"
              style={{
                ...pfosS.radyo,
                ...(lokasyon === lok ? pfosS.secili : {}),
              }}
              onClick={() => onLokasyon(lok)}
            >
              {lok === "cadde" ? "Cadde / sokak" : "AVM"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        style={{ ...pfosS.devam, ...(!ok ? pfosS.pasif : {}) }}
        disabled={!ok}
        onClick={onDevam}
      >
        Devam — Konsept →
      </button>
    </div>
  );
}
