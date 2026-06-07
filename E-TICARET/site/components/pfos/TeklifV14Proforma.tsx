"use client";

import { DownloadOutlined, PrinterOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Collapse, Form, Input, Modal, Typography } from "antd";
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
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<
    | { kind: "ok"; refNo: string; emailSent: boolean; emailNote?: string }
    | { kind: "err"; message: string }
    | null
  >(null);
  const [form] = Form.useForm<{
    ad: string;
    telefon: string;
    eposta: string;
    not?: string;
  }>();
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

  function openSendModal() {
    form.setFieldsValue({
      ad: ust.musteri?.trim() || "",
      telefon: "",
      eposta: "",
      not: "",
    });
    setSendOpen(true);
  }

  function slimKalemler() {
    return model.satirlar.map((s) => ({
      bolumNo: s.bolumNo,
      bolumBaslik: s.bolumBaslik,
      poz: s.poz,
      stokNo: s.stokNo,
      tanim: s.tanim,
      marka: s.marka,
      adet: s.adet,
      birimSatis: s.birimSatis,
      toplamSatis: s.toplamSatis,
      doviz: s.doviz,
    }));
  }

  function slimTeklifV14ForApi(m: TeklifModelV14): TeklifModelV14 {
    return {
      ...m,
      satirlar: m.satirlar.map(({ fotoUrl: _foto, ...rest }) => rest),
    };
  }

  async function handleSend(values: {
    ad: string;
    telefon: string;
    eposta: string;
    not?: string;
  }) {
    setSending(true);
    try {
      const eurTry = ust.eurTry ?? 0;
      const genelEur = ozet.genelToplam ?? 0;
      const toplamTl =
        eurTry > 0 && genelEur > 0
          ? Math.round(genelEur * eurTry)
          : Math.round(genelEur);

      const res = await fetch("/api/teklifler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri: {
            ad: values.ad.trim(),
            telefon: values.telefon.trim(),
            eposta: (values.eposta || "").trim(),
          },
          not: (values.not || "").trim(),
          konsept: meta.konseptLabel || meta.konsept,
          proje: {
            konsept: meta.konsept,
            alan_m2: meta.m2Toplam,
            sehir: meta.sehir,
          },
          tahmini_toplam_tl: toplamTl,
          kalemler: slimKalemler(),
          kaynak: "pfos-v14",
          teklif_sayi: ust.sayi,
          teklif_v14: slimTeklifV14ForApi(model),
        }),
      });
      let json: {
        success?: boolean;
        error?: string;
        data?: { ref_no?: string; id?: string };
        customer_email?: {
          attempted?: boolean;
          sent?: boolean;
          error?: string;
        };
      };
      try {
        json = (await res.json()) as typeof json;
      } catch {
        throw new Error(`Sunucu yanıtı okunamadı (HTTP ${res.status})`);
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Teklif gönderilemedi (HTTP ${res.status})`);
      }
      const refNo = json.data?.ref_no || json.data?.id || "";
      const w = window as Window & {
        equstoTrackConversion?: (
          type: string,
          params?: Record<string, unknown>,
        ) => void;
      };
      try {
        w.equstoTrackConversion?.("quote", {
          kaynak: "pfos-v14",
          ref_no: refNo,
          teklif: ust.sayi,
        });
      } catch {
        /* analytics optional */
      }
      form.resetFields();
      setSendOpen(false);
      const ce = json.customer_email;
      const emailSent = ce?.sent === true;
      let emailNote: string | undefined;
      if (ce?.attempted && !ce.sent && ce.error) {
        emailNote = ce.error;
      } else if (ce?.attempted === false && !ce?.sent) {
        emailNote = "E-posta servisi yapılandırılmamış";
      }
      setSendResult({
        kind: "ok",
        refNo,
        emailSent,
        emailNote,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Teklif gönderilemedi";
      setSendResult({ kind: "err", message: msg });
    } finally {
      setSending(false);
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
          icon={<SendOutlined />}
          onClick={openSendModal}
        >
          Teklifi Equsto&apos;ya gönder
        </Button>
        <Button
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

      <Modal
        title="Teklifi Equsto'ya gönder"
        open={sendOpen}
        onCancel={() => !sending && setSendOpen(false)}
        footer={null}
        destroyOnClose
        zIndex={13000}
        getContainer={() => document.body}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Bilgileriniz satış ekibimize iletilir; teklif listeniz kayda alınır ve
          e-posta adresinize Excel dosyası gönderilir.
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={handleSend}>
          <Form.Item
            name="ad"
            label="Ad Soyad"
            rules={[{ required: true, message: "Ad gerekli" }]}
          >
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="telefon"
            label="Telefon"
            rules={[{ required: true, message: "Telefon gerekli" }]}
          >
            <Input placeholder="0532…" autoComplete="tel" />
          </Form.Item>
          <Form.Item
            name="eposta"
            label="E-posta"
            rules={[
              { required: true, message: "E-posta gerekli" },
              { type: "email", message: "Geçerli bir e-posta girin" },
            ]}
          >
            <Input type="email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="not" label="Not (opsiyonel)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={sending} block>
            Gönder
          </Button>
        </Form>
      </Modal>

      <Modal
        title={
          sendResult?.kind === "ok"
            ? "Teklifiniz alındı"
            : "Teklif gönderilemedi"
        }
        open={sendResult != null}
        onOk={() => setSendResult(null)}
        onCancel={() => setSendResult(null)}
        okText="Tamam"
        cancelButtonProps={{ style: { display: "none" } }}
        zIndex={14000}
        getContainer={() => document.body}
      >
        {sendResult?.kind === "ok" ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {sendResult.refNo ? (
              <>
                Referans: <strong>{sendResult.refNo}</strong>
                <br />
                Ekibimiz en kısa sürede sizinle iletişime geçecek.
              </>
            ) : (
              "Ekibimiz en kısa sürede sizinle iletişime geçecek."
            )}
            {sendResult.emailSent ? (
              <>
                <br />
                <br />
                Teklif Excel dosyanız e-posta adresinize gönderildi.
              </>
            ) : sendResult.emailNote ? (
              <>
                <br />
                <br />
                <Typography.Text type="warning">
                  E-posta gönderilemedi: {sendResult.emailNote}
                </Typography.Text>
              </>
            ) : null}
          </Typography.Paragraph>
        ) : (
          <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
            {sendResult?.message}
          </Typography.Paragraph>
        )}
      </Modal>
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
