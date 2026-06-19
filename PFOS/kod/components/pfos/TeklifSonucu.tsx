"use client";

import type { CSSProperties } from "react";
import type { PFOSResponse, PFOSKalemi } from "@/lib/pfos/schemas/pfos.schema";
import { KATEGORI_LABELS } from "@/lib/pfos/schemas/pfos.schema";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import { formatKwHucre } from "@/lib/pfos/teklif/format-v14";

type Props = { sonuc: PFOSResponse };

export default function TeklifSonucu({ sonuc }: Props) {
  const { kalemler, ozet, guvenSkoru, konseptLabel, m2, sehir, uyarilar } =
    sonuc;

  const gruplar = kalemler.reduce<Record<string, PFOSKalemi[]>>((acc, k) => {
    const key = k.zoneKey
      ? `zone:${k.zoneKey}`
      : `kat:${k.kategoriKodu}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(k);
    return acc;
  }, {});

  const skorRenk =
    guvenSkoru >= 0.75 ? "#2d7a2d" : guvenSkoru >= 0.5 ? "#b36b00" : "#c00";

  return (
    <div style={s.wrap}>
      <div style={s.baslikBand}>
        <div>
          <div style={s.baslik}>EQUSTO PROJE FABRİKASI</div>
          <div style={s.alt}>
            {konseptLabel} · {sehir ?? "—"} · {m2} m²
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...s.skor, color: skorRenk }}>
            %{Math.round(guvenSkoru * 100)} Güven
          </div>
          <div style={s.skorAlt}>
            {ozet.eslesmisZorunluSayisi}/{ozet.zorunluKalemSayisi} zorunlu
            eşleşti
          </div>
        </div>
      </div>

      {Object.entries(gruplar).map(([groupKey, items]) => {
        const isZone = groupKey.startsWith("zone:");
        const zoneKey = isZone ? groupKey.slice(5) : "";
        const kat = isZone ? items[0]?.kategoriKodu : groupKey.slice(4);
        const baslik = isZone
          ? zoneLabel(zoneKey)
          : `${kat} — ${KATEGORI_LABELS[kat as keyof typeof KATEGORI_LABELS] ?? kat}`;
        return (
        <div key={groupKey} style={s.grup}>
          <div style={s.grupBaslik}>{baslik}</div>
          <table style={s.tablo}>
            <thead>
              <tr style={s.thRow}>
                <th style={s.th}>Poz</th>
                <th style={s.th}>Ürün</th>
                <th style={s.th}>Marka</th>
                <th style={s.thR}>Ad</th>
                <th style={s.thR}>Elk. kW</th>
                <th style={s.thR}>Gaz kW</th>
                <th style={s.thR}>Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {items.map((k) => (
                <tr
                  key={k.poz}
                  style={k.tip === "zorunlu" ? undefined : s.opsRow}
                >
                  <td style={s.td}>{k.poz}</td>
                  <td style={s.td}>
                    <div style={s.isim}>{k.isim}</div>
                    {k.tip !== "zorunlu" && (
                      <div style={s.badge}>{k.tip}</div>
                    )}
                  </td>
                  <td style={s.td}>
                    {k.urun?.marka ?? <span style={s.eksik}>—</span>}
                  </td>
                  <td style={s.tdR}>{k.adet}</td>
                  <td style={s.tdR}>
                    {k.urun?.elektrikGucuKw != null
                      ? formatKwHucre(k.urun.elektrikGucuKw)
                      : k.elektrikGucuKwHint != null
                        ? (
                            <span style={s.ipucu}>{formatKwHucre(k.elektrikGucuKwHint)}~</span>
                          )
                        : "—"}
                  </td>
                  <td style={s.tdR}>
                    {k.urun?.gazGucuKw != null
                      ? formatKwHucre(k.urun.gazGucuKw)
                      : k.gazGucuKwHint != null
                        ? <span style={s.ipucu}>{formatKwHucre(k.gazGucuKwHint)}~</span>
                        : "—"}
                  </td>
                  <td style={s.tdR}>
                    {k.urun ? (
                      `${(k.urun.fiyat * k.adet).toLocaleString("tr-TR")} ${k.urun.doviz}`
                    ) : (
                      <span style={s.eksik}>Katalog yok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        );
      })}

      <div style={s.toplamlBand}>
        <div style={s.toplam}>
          <span style={s.toplamLabel}>Toplam Elektrik</span>
          <span style={s.toplamDeger}>{ozet.toplamElektrikKw} kW</span>
        </div>
        <div style={s.toplam}>
          <span style={s.toplamLabel}>Toplam Gaz</span>
          <span style={s.toplamDeger}>{ozet.toplamGazKw} kW</span>
        </div>
        {ozet.toplamFiyat != null && (
          <div style={s.toplam}>
            <span style={s.toplamLabel}>Tahmini Ekipman Toplamı</span>
            <span style={s.toplamDeger}>
              {ozet.toplamFiyat.toLocaleString("tr-TR")} {ozet.doviz}
            </span>
          </div>
        )}
      </div>

      {uyarilar.length > 0 && (
        <div style={s.uyarilar}>
          {uyarilar.map((u, i) => (
            <div key={i} style={s.uyari}>
              {u}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { fontFamily: "system-ui, sans-serif", color: "#333" },
  baslikBand: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "2px solid #000",
  },
  baslik: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  alt: { fontSize: 13, color: "#666", marginTop: 4 },
  skor: { fontSize: 22, fontWeight: 700 },
  skorAlt: { fontSize: 11, color: "#999", marginTop: 2 },
  grup: { marginBottom: 0 },
  grupBaslik: {
    padding: "10px 24px",
    background: "#f5f5f5",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #ddd",
  },
  tablo: { width: "100%", borderCollapse: "collapse" },
  thRow: { borderBottom: "1px solid #ddd" },
  th: {
    padding: "8px 12px 8px 24px",
    fontSize: 11,
    textTransform: "uppercase",
    color: "#999",
    textAlign: "left",
    fontWeight: 600,
  },
  thR: {
    padding: "8px 24px 8px 12px",
    fontSize: 11,
    textTransform: "uppercase",
    color: "#999",
    textAlign: "right",
    fontWeight: 600,
  },
  td: {
    padding: "10px 12px 10px 24px",
    fontSize: 13,
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
  },
  tdR: {
    padding: "10px 24px 10px 12px",
    fontSize: 13,
    borderBottom: "1px solid #f0f0f0",
    textAlign: "right",
    verticalAlign: "middle",
  },
  opsRow: { opacity: 0.65 },
  isim: { fontWeight: 500 },
  badge: {
    display: "inline-block",
    marginTop: 3,
    fontSize: 10,
    padding: "2px 6px",
    border: "1px solid #ccc",
    color: "#666",
  },
  eksik: { color: "#bbb" },
  ipucu: { color: "#aaa" },
  toplamlBand: {
    display: "flex",
    flexWrap: "wrap",
    gap: 32,
    padding: "16px 24px",
    borderTop: "2px solid #000",
    background: "#fafafa",
  },
  toplam: { display: "flex", flexDirection: "column" },
  toplamLabel: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  toplamDeger: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  uyarilar: {
    padding: "12px 24px",
    background: "#fffbf0",
    borderTop: "1px solid #ffe",
  },
  uyari: { fontSize: 12, color: "#666", marginBottom: 4 },
};
