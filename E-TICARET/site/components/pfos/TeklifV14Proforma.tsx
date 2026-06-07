"use client";

import { DownloadOutlined, MailOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Collapse, Form, Input, Modal, Typography } from "antd";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { groupTeklifV14Satirlar } from "@/lib/pfos/teklif/group-v14-bolumler";
import { formatTarihTr, formatKwHucre } from "@/lib/pfos/teklif/format-v14";
import { downloadTeklifV14Excel } from "@/lib/pfos/teklif/export-teklif-v14.client";
import { printTeklifV14 } from "@/lib/pfos/teklif/print-teklif-v14.client";
import { TEKLIF_V14_FORM_NO, TEKLIF_BOLUM_ROW_FILL } from "@/lib/pfos/teklif/constants";

type Props = {
  model: TeklifModelV14;
  /** Halk PFOS: yalnızca e-posta / WhatsApp ile PDF; indirme yok */
  deliveryOnly?: boolean;
};

type SendKanal = "email" | "whatsapp";

type DeliveryResult = {
  kind: "ok";
  refNo: string;
  kanal: SendKanal;
  sent: boolean;
  note?: string;
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

/** Üye oturumu / sepet checkout — Mr. Equsto modal ile paylaşılan telefon */
function readSavedCustomerContact(): {
  ad: string;
  telefon: string;
  eposta: string;
} {
  if (typeof window === "undefined") {
    return { ad: "", telefon: "", eposta: "" };
  }
  try {
    const m = JSON.parse(
      localStorage.getItem("equsto_member_v1") || "null",
    ) as Record<string, string> | null;
    const c = JSON.parse(
      localStorage.getItem("equsto_checkout_v1") || "null",
    ) as Record<string, string> | null;
    return {
      ad: String(m?.ad || m?.displayName || m?.name || c?.ad || "").trim(),
      telefon: String(m?.telefon || m?.phone || c?.telefon || c?.tel || "").trim(),
      eposta: String(m?.email || m?.eposta || c?.eposta || "").trim(),
    };
  } catch {
    return { ad: "", telefon: "", eposta: "" };
  }
}

type EqustoMemberWindow = Window & {
  equstoIsMemberLoggedIn?: () => boolean;
  equstoGetMemberToken?: () => string;
  equstoSetMemberActive?: (extra: Record<string, string>) => void;
  equstoWaRecordDelivery?: (opts: {
    kanal: SendKanal;
    refNo: string;
    telefon: string;
    eposta: string;
    teklifSayi: string;
    sent: boolean;
    error?: string;
  }) => void;
  equstoTrackConversion?: (type: string, params?: Record<string, unknown>) => void;
};

function memberLoggedInNow(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as EqustoMemberWindow).equstoIsMemberLoggedIn?.());
}

export default function TeklifV14Proforma({ model, deliveryOnly = false }: Props) {
  const [exporting, setExporting] = useState(false);
  const [sendingKanal, setSendingKanal] = useState<SendKanal | null>(null);
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [sendResult, setSendResult] = useState<
    DeliveryResult | { kind: "err"; message: string } | null
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

  function applySavedCustomerContact() {
    if (!deliveryOnly) return;
    const saved = readSavedCustomerContact();
    const current = form.getFieldsValue();
    form.setFieldsValue({
      ad: current.ad?.trim() || saved.ad || ust.musteri?.trim() || "",
      telefon: current.telefon?.trim() || saved.telefon || "",
      eposta: current.eposta?.trim() || saved.eposta || "",
    });
  }

  useEffect(() => {
    if (!deliveryOnly) return;
    const syncMember = () => {
      setMemberLoggedIn(memberLoggedInNow());
      applySavedCustomerContact();
    };
    syncMember();
    document.addEventListener("equsto-member-session", syncMember);
    document.addEventListener("equsto-member-changed", syncMember);
    return () => {
      document.removeEventListener("equsto-member-session", syncMember);
      document.removeEventListener("equsto-member-changed", syncMember);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form doldurma: mount + üye oturumu
  }, [deliveryOnly, ust.musteri]);

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

  async function handleSend(kanal: SendKanal) {
    if (deliveryOnly && !memberLoggedInNow()) {
      setSendResult({ kind: "err", message: "Üye girişi gerekli" });
      return;
    }

    let values: {
      ad: string;
      telefon: string;
      eposta: string;
      not?: string;
    };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (kanal === "email" && !values.eposta?.trim()) {
      form.setFields([{ name: "eposta", errors: ["E-posta gerekli"] }]);
      return;
    }
    if (kanal === "whatsapp" && !values.telefon?.trim()) {
      form.setFields([{ name: "telefon", errors: ["Telefon gerekli"] }]);
      return;
    }

    setSendingKanal(kanal);
    try {
      const eurTry = ust.eurTry ?? 0;
      const genelEur = ozet.genelToplam ?? 0;
      const toplamTl =
        eurTry > 0 && genelEur > 0
          ? Math.round(genelEur * eurTry)
          : Math.round(genelEur);

      const w = window as EqustoMemberWindow;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = w.equstoGetMemberToken?.() || "";
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        headers["X-Equsto-Authorization"] = token;
      }

      const res = await fetch("/api/teklifler", {
        method: "POST",
        headers,
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
          gonderim_kanali: kanal,
        }),
      });

      let json: {
        success?: boolean;
        error?: string;
        data?: { ref_no?: string; id?: string };
        customer_email?: { attempted?: boolean; sent?: boolean; error?: string };
        customer_whatsapp?: { attempted?: boolean; sent?: boolean; error?: string };
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
      const w = window as EqustoMemberWindow;
      try {
        w.equstoTrackConversion?.("quote", {
          kaynak: "pfos-v14",
          ref_no: refNo,
          teklif: ust.sayi,
          kanal,
        });
      } catch {
        /* analytics optional */
      }

      const delivery =
        kanal === "whatsapp" ? json.customer_whatsapp : json.customer_email;
      const sent = delivery?.sent === true;
      let note: string | undefined;
      if (delivery?.attempted && !delivery.sent && delivery.error) {
        note = delivery.error;
      } else if (delivery?.attempted === false && !delivery?.sent) {
        note =
          kanal === "email"
            ? "E-posta servisi yapılandırılmamış"
            : "WhatsApp sunucu gönderimi yapılandırılmamış";
      }

      setSendResult({ kind: "ok", refNo, kanal, sent, note });

      try {
        if (w.equstoIsMemberLoggedIn?.()) {
          w.equstoSetMemberActive?.({
            ad: values.ad.trim(),
            telefon: values.telefon.trim(),
            eposta: (values.eposta || "").trim(),
          });
          w.equstoWaRecordDelivery?.({
            kanal,
            refNo,
            telefon: values.telefon.trim(),
            eposta: (values.eposta || "").trim(),
            teklifSayi: ust.sayi,
            sent,
            error: note,
          });
        }
      } catch {
        /* modal kaydı isteğe bağlı */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Teklif gönderilemedi";
      setSendResult({ kind: "err", message: msg });
    } finally {
      setSendingKanal(null);
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

      {deliveryOnly ? (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #d9f7be",
            borderRadius: 8,
            background: "#f6ffed",
          }}
        >
          {!memberLoggedIn ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <a
                href="/login"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#008069",
                  textDecoration: "none",
                }}
              >
                Üye Girişi
              </a>
            </div>
          ) : (
            <>
              <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                Teklifinizi alın
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                PDF teklifiniz yalnızca e-posta veya WhatsApp ile gönderilir;
                bilgisayarınıza indirme seçeneği sunulmaz.
              </Typography.Paragraph>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  ad: ust.musteri?.trim() || "",
                  telefon: "",
                  eposta: "",
                  not: "",
                }}
              >
                <Form.Item
                  name="ad"
                  label="Ad Soyad"
                  rules={[{ required: true, message: "Ad gerekli" }]}
                >
                  <Input autoComplete="name" />
                </Form.Item>
                <Form.Item
                  name="telefon"
                  label="Telefon (WhatsApp)"
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
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button
                    type="primary"
                    icon={<MailOutlined />}
                    loading={sendingKanal === "email"}
                    disabled={sendingKanal === "whatsapp"}
                    onClick={() => void handleSend("email")}
                  >
                    E-postama gönder (PDF)
                  </Button>
                  <Button
                    style={{
                      background: "#25D366",
                      borderColor: "#25D366",
                      color: "#fff",
                    }}
                    loading={sendingKanal === "whatsapp"}
                    disabled={sendingKanal === "email"}
                    onClick={() => void handleSend("whatsapp")}
                  >
                    WhatsApp&apos;ıma gönder (PDF)
                  </Button>
                </div>
              </Form>
            </>
          )}
        </div>
      ) : (
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
      )}

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
        title={
          sendResult?.kind === "ok"
            ? sendResult.kanal === "whatsapp"
              ? "WhatsApp gönderildi"
              : "E-posta gönderildi"
            : "Gönderilemedi"
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
              </>
            ) : null}
            {sendResult.sent ? (
              sendResult.kanal === "whatsapp" ? (
                <>
                  PDF teklifiniz WhatsApp numaranıza gönderildi.
                  <br />
                  Ekibimiz en kısa sürede sizinle iletişime geçecek.
                </>
              ) : (
                <>
                  PDF teklifiniz e-posta adresinize gönderildi.
                  <br />
                  Ekibimiz en kısa sürede sizinle iletişime geçecek.
                </>
              )
            ) : (
              <>
                Teklif kayda alındı.
                {sendResult.note ? (
                  <>
                    <br />
                    <br />
                    <Typography.Text type="warning">
                      PDF gönderilemedi: {sendResult.note}
                    </Typography.Text>
                  </>
                ) : null}
              </>
            )}
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
