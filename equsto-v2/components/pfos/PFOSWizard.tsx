"use client";

import { useState, useEffect } from "react";
import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import TeklifSonucu from "./TeklifSonucu";

type KonseptMeta = {
  konsept: string;
  label: string;
  ornekler: string[];
  m2Min: number;
  m2Max: number;
  itemSayisi: number;
  zorunluSayisi: number;
};

type WizardState = {
  adim: number;
  sehir: string;
  konsept: string | null;
  m2: number | string;
  lokasyon: "cadde" | "avm";
};

const SEHIRLER = [
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
];

export default function PFOSWizard() {
  const [state, setState] = useState<WizardState>({
    adim: 0,
    sehir: "İstanbul",
    konsept: null,
    m2: "",
    lokasyon: "cadde",
  });
  const [konseptler, setKonseptler] = useState<KonseptMeta[]>([]);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pfos/concepts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKonseptler(data);
        else if (data?.konseptler) setKonseptler(data.konseptler);
      })
      .catch(() => setHata("Konseptler yüklenemedi."));
  }, []);

  const set = (patch: Partial<WizardState>) =>
    setState((s) => ({ ...s, ...patch }));

  async function teklifOlustur() {
    if (!state.konsept || !state.m2) return;
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/pfos/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konsept: state.konsept,
          m2: Number(state.m2),
          sehir: state.sehir,
          lokasyon: state.lokasyon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Sunucu hatası");
      if (data?.data) {
        setSonuc(data.data as PFOSResponse);
      } else {
        setSonuc(data as PFOSResponse);
      }
      set({ adim: 3 });
    } catch (e: unknown) {
      setHata(e instanceof Error ? e.message : "Teklif oluşturulamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  if (state.adim === 0)
    return (
      <div style={s.panel}>
        <h2 style={s.baslik}>Projeniz hangi şehirde?</h2>
        <div style={s.grid2}>
          {SEHIRLER.map((sehir) => (
            <button
              key={sehir}
              type="button"
              style={{ ...s.kart, ...(state.sehir === sehir ? s.secili : {}) }}
              onClick={() => set({ sehir })}
            >
              {sehir}
            </button>
          ))}
        </div>
        <button type="button" style={s.devam} onClick={() => set({ adim: 1 })}>
          Devam — {state.sehir} →
        </button>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <a href="/pfos-klasik">Tam sürüm (Mr. Equsto sihirbazı)</a>
        </p>
      </div>
    );

  if (state.adim === 1)
    return (
      <div style={s.panel}>
        <button type="button" style={s.geri} onClick={() => set({ adim: 0 })}>
          ← Geri
        </button>
        <h2 style={s.baslik}>Konseptiniz nedir?</h2>
        {konseptler.length === 0 ? (
          <p style={s.bilgi}>Yükleniyor…</p>
        ) : (
          <div style={s.grid3}>
            {konseptler.map((k) => (
              <button
                key={k.konsept}
                type="button"
                style={{
                  ...s.kart,
                  ...(state.konsept === k.konsept ? s.secili : {}),
                }}
                onClick={() => set({ konsept: k.konsept })}
              >
                <div style={s.kartBaslik}>{k.label}</div>
                <div style={s.kartAlt}>{k.ornekler.slice(0, 2).join(" · ")}</div>
                <div style={s.kartMeta}>
                  {k.m2Min}–{k.m2Max} m² · {k.zorunluSayisi} kalem
                </div>
              </button>
            ))}
          </div>
        )}
        {state.konsept && (
          <button type="button" style={s.devam} onClick={() => set({ adim: 2 })}>
            Devam →
          </button>
        )}
      </div>
    );

  const seciliKonsept = konseptler.find((k) => k.konsept === state.konsept);

  if (state.adim === 2)
    return (
      <div style={s.panel}>
        <button type="button" style={s.geri} onClick={() => set({ adim: 1 })}>
          ← Geri
        </button>
        <h2 style={s.baslik}>Mekanınızın detayları</h2>
        <div style={s.alan}>
          <label style={s.etiket}>
            Toplam alan (m²)
            {seciliKonsept && (
              <span style={s.ipucu}>
                {" "}
                · önerilen {seciliKonsept.m2Min}–{seciliKonsept.m2Max} m²
              </span>
            )}
          </label>
          <input
            type="number"
            style={s.input}
            placeholder="Örn: 150"
            value={state.m2}
            onChange={(e) => set({ m2: e.target.value })}
            min={30}
            max={2000}
          />
        </div>
        <div style={s.alan}>
          <label style={s.etiket}>Lokasyon tipi</label>
          <div style={s.radyoGrup}>
            {(["cadde", "avm"] as const).map((lok) => (
              <button
                key={lok}
                type="button"
                style={{
                  ...s.radyo,
                  ...(state.lokasyon === lok ? s.secili : {}),
                }}
                onClick={() => set({ lokasyon: lok })}
              >
                {lok === "cadde" ? "🏘 Cadde / Sokak" : "🏬 AVM"}
              </button>
            ))}
          </div>
        </div>
        {hata && <p style={s.hata}>{hata}</p>}
        <button
          type="button"
          style={{ ...s.devam, ...(!state.m2 || yukleniyor ? s.pasif : {}) }}
          disabled={!state.m2 || yukleniyor}
          onClick={teklifOlustur}
        >
          {yukleniyor ? "Teklif oluşturuluyor…" : "Teklif Oluştur →"}
        </button>
      </div>
    );

  if (state.adim === 3 && sonuc)
    return (
      <div>
        <div style={s.sonucUst}>
          <button
            type="button"
            style={s.geri}
            onClick={() => {
              setSonuc(null);
              set({ adim: 0, konsept: null, m2: "" });
            }}
          >
            ← Yeni Teklif
          </button>
        </div>
        <TeklifSonucu sonuc={sonuc} />
      </div>
    );

  return null;
}

const s: Record<string, React.CSSProperties> = {
  panel: { maxWidth: 720, margin: "0 auto", padding: "32px 24px" },
  baslik: { fontSize: 22, fontWeight: 600, marginBottom: 24, color: "#000" },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 24,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 24,
  },
  kart: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  secili: { border: "2px solid #000", background: "#f5f5f5" },
  kartBaslik: { fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#000" },
  kartAlt: { fontSize: 12, color: "#666", marginBottom: 4 },
  kartMeta: { fontSize: 11, color: "#999" },
  devam: {
    marginTop: 16,
    padding: "12px 28px",
    background: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontFamily: "inherit",
  },
  pasif: { background: "#999", cursor: "not-allowed" },
  geri: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    padding: 0,
    fontFamily: "inherit",
  },
  alan: { marginBottom: 20 },
  etiket: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    color: "#333",
  },
  ipucu: { fontWeight: 400, color: "#999" },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ccc",
    fontSize: 16,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  radyoGrup: { display: "flex", gap: 10 },
  radyo: {
    padding: "10px 20px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
  },
  bilgi: { color: "#999", fontSize: 14 },
  hata: { color: "#c00", fontSize: 13, marginBottom: 12 },
  sonucUst: { padding: "16px 24px", borderBottom: "1px solid #eee" },
};
