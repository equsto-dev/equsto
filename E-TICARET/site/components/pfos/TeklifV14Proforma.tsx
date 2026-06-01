"use client";

import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Collapse, Typography } from "antd";
import { Fragment, useState, type CSSProperties } from "react";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { groupTeklifV14Satirlar } from "@/lib/pfos/teklif/group-v14-bolumler";
import { formatTarihTr, formatKwHucre } from "@/lib/pfos/teklif/format-v14";
import { downloadTeklifV14Excel } from "@/lib/pfos/teklif/export-teklif-v14.client";
import { printTeklifV14 } from "@/lib/pfos/teklif/print-teklif-v14.client";
import { TEKLIF_V14_FORM_NO, TEKLIF_BOLUM_ROW_FILL } from "@/lib/pfos/teklif/constants";

type Props = {
  model: TeklifModelV14;
};

const COLS = [
  "Böl.",
  "Poz",
  "EK",
  "Stok no",
  "Tanımı",
  "Marka",
  "Ölçü",
  "Elk. kW",
  "Gaz kW",
  "Adet",
  "Satış",
  "Toplam",
] as const;

export default function TeklifV14Proforma({ model }: Props) {
  const [exporting, setExporting] = useState(false);
  const { ust, ozet, meta } = model;
  const blocks = groupTeklifV14Satirlar(model.satirlar);
  const tarih = formatTarihTr(ust.tarih);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadTeklifV14Excel(model);
    } catch (e) {
      console.error(e);
      alert("Excel dosyası oluşturulamadı. Şablon yüklendi mi kontrol edin.");
    } finally {
      setExporting(false);
    }
  }

  const eqSk =
    "EQ-SK-2026-PFOS-" +
    String(ust.sayi || "000")
      .replace(/[^A-Za-z0-9-]/g, "")
      .slice(0, 24);

  return (
    <div style={{ fontFamily: "Arial, system-ui, sans-serif" }}>
      <span style={{ display: "none" }} aria-hidden="true">
        {eqSk}
      </span>
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "start",
          }}
        >
          <div>
            <Typography.Text
              strong
              style={{ fontSize: 11, letterSpacing: "0.06em" }}
            >
              PROFORMA FATURA
            </Typography.Text>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              <strong>Proje:</strong> {ust.projeAdi}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <strong>Müşteri:</strong> {ust.musteri || "—"}
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {meta.konseptLabel} · {meta.m2Toplam} m² · {meta.teslimatAdresi}
            </Typography.Text>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, minWidth: 180 }}>
            <div>
              <strong>Sayı:</strong> {ust.sayi}
            </div>
            <div>
              <strong>Tarih:</strong> {tarih}
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>EUR/TRY:</strong>{" "}
              {ust.eurTry != null
                ? ust.eurTry.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })
                : "—"}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#666" }}>
              TCMB Efektif Satış Kuru – {tarih}
            </div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              {COLS.map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <Fragment key={block.bolumBaslik}>
                <tr>
                  <td colSpan={COLS.length} style={sectionTd}>
                    {block.bolumBaslik}
                  </td>
                </tr>
                {block.satirlar.map((row, i) => (
                  <Fragment key={`${row.poz}-${i}`}>
                    <tr>
                      <td style={td}>{row.bolumNo}</td>
                      <td style={td}>{row.poz}</td>
                      <td style={td}>{row.ek || ""}</td>
                      <td style={td}>{row.stokNo}</td>
                      <td style={td}>{row.tanim}</td>
                      <td style={td}>{row.marka}</td>
                      <td style={td}>{row.olcu || "—"}</td>
                      <td style={tdR}>{formatKwHucre(row.elkKw)}</td>
                      <td style={tdR}>{formatKwHucre(row.gazKw)}</td>
                      <td style={tdR}>{row.adet}</td>
                      <td style={tdR}>
                        {row.birimSatis != null
                          ? row.birimSatis.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td style={tdR}>
                        {row.toplamSatis != null
                          ? row.toplamSatis.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                    </tr>
                    {(row.fotoUrl || row.fotoNot || row.aciklama) && (
                      <tr>
                        <td colSpan={7} style={specTdFoto}>
                          {row.fotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.fotoUrl}
                              alt=""
                              style={{
                                maxWidth: 120,
                                maxHeight: 100,
                                objectFit: "contain",
                                display: "block",
                                margin: "0 auto",
                              }}
                            />
                          ) : (
                            row.fotoNot ?? "📷 Fotoğraf"
                          )}
                        </td>
                        <td colSpan={5} style={specTd}>
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {row.aciklama}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Fragment>
            ))}
            <tr>
              <td colSpan={4} style={td} />
              <td
                colSpan={2}
                style={{ ...td, textAlign: "right", fontWeight: 600 }}
              >
                Sütun toplamları →
              </td>
              <td style={tdR}>{formatKwHucre(ozet.toplamElektrikKw)}</td>
              <td style={tdR}>{formatKwHucre(ozet.toplamGazKw)}</td>
              <td style={tdR} />
              <td colSpan={2} style={{ ...td, fontWeight: 700 }}>
                GENEL TOPLAM
              </td>
              <td style={{ ...tdR, fontWeight: 700 }}>
                {ozet.genelToplam != null
                  ? `${ozet.genelToplam.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })} ${ozet.doviz}`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Excel indir
        </Button>
        <Button icon={<PrinterOutlined />} onClick={() => printTeklifV14(model)}>
          PDF / Yazdır
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Form no: {TEKLIF_V14_FORM_NO}
        </Typography.Text>
      </div>

      <Collapse
        style={{ marginTop: 16 }}
        size="small"
        items={[
          {
            key: "sartlar",
            label: "Şartlarımız",
            children: (
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                {model.sartlar.map((s, i) => (
                  <div key={i}>{s}</div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 11,
};

const thStyle: CSSProperties = {
  textAlign: "center",
  padding: "6px 4px",
  borderBottom: "1px solid #ccc",
  fontWeight: 700,
  fontSize: 10,
  whiteSpace: "nowrap",
};

const td: CSSProperties = {
  padding: "5px 4px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};

const tdR: CSSProperties = { ...td, textAlign: "right" };

const sectionTd: CSSProperties = {
  padding: "8px 4px",
  fontWeight: 700,
  background: TEKLIF_BOLUM_ROW_FILL,
  borderBottom: "1px solid #b7dfc5",
  color: "#1e4620",
};

const specTd: CSSProperties = {
  padding: "8px 4px",
  borderBottom: "1px solid #eee",
  background: "#fafafa",
  fontSize: 10,
  verticalAlign: "top",
};

const specTdFoto: CSSProperties = {
  ...specTd,
  textAlign: "center",
  verticalAlign: "middle",
};
