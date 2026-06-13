"use client";

import { DownloadOutlined, MailOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Collapse, Form, Modal, Typography } from "antd";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { groupTeklifV14Satirlar } from "@/lib/pfos/teklif/group-v14-bolumler";
import { formatTarihTr, formatKwHucre } from "@/lib/pfos/teklif/format-v14";
import { downloadTeklifV14Excel } from "@/lib/pfos/teklif/export-teklif-v14.client";
import { printTeklifV14 } from "@/lib/pfos/teklif/print-teklif-v14.client";
import { sanitizeTeklifV14SatirTanim } from "@/lib/pfos/teklif/sanitize-teklif-v14-export";
import { TEKLIF_V14_FORM_NO, TEKLIF_BOLUM_ROW_FILL } from "@/lib/pfos/teklif/constants";
import { normalizeTeklifAciklamaText } from "@/lib/pfos/teklif/catalog-teklif-aciklama";
import { memberLoggedInNow } from "@/lib/pfos/member-session.client";

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
  "Stok no",
  "Tanımı",
  "Elk. kW",
  "Gaz kW",
  "Adet",
  "Satış",
  "Toplam",
  "Marka",
  "Ölçü",
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

export default function TeklifV14Proforma({ model, deliveryOnly = false }: Props) {
  const [exporting, setExporting] = useState(false);
  const [sendingKanal, setSendingKanal] = useState<SendKanal | null>(null);
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
    applySavedCustomerContact();
    const syncContact = () => applySavedCustomerContact();
    document.addEventListener("equsto-member-session", syncContact);
    document.addEventListener("equsto-member-changed", syncContact);
    return () => {
      document.removeEventListener("equsto-member-session", syncContact);
      document.removeEventListener("equsto-member-changed", syncContact);
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
    return m;
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

    if (deliveryOnly && memberLoggedInNow()) {
      const saved = readSavedCustomerContact();
      values = {
        ad: saved.ad,
        telefon: saved.telefon,
        eposta: saved.eposta,
        not: "",
      };
    } else {
      try {
        values = await form.validateFields();
      } catch {
        return;
      }
    }

    if (!values.ad?.trim()) {
      setSendResult({
        kind: "err",
        message: "Profilinizde ad bilgisi yok — hesabınızı güncelleyin",
      });
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
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              {COLS.map((h) => (
                <th
                  key={h}
                  style={
                    h === "Marka" || h === "Ölçü" ? thMarkaOlcu : thStyle
                  }
                >
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
                {block.satirlar.map((row, i) => {
                  const hasKnownProduct =
                    Boolean(row.stokNo?.trim()) && row.birimSatis != null;
                  const aciklamaMetni = normalizeTeklifAciklamaText(row.aciklama);
                  const showSpecRow =
                    Boolean(aciklamaMetni) ||
                    Boolean(row.fotoUrl) ||
                    hasKnownProduct;
                  return (
                  <Fragment key={`${row.poz}-${i}`}>
                    <tr>
                      <td style={td}>{row.bolumNo}</td>
                      <td style={td}>{row.poz}</td>
                      <td style={tdStok}>{row.stokNo}</td>
                      <td style={tdTanim}>
                        {sanitizeTeklifV14SatirTanim(row.tanim)}
                      </td>
                      <td style={tdC}>{formatKwHucre(row.elkKw)}</td>
                      <td style={tdC}>{formatKwHucre(row.gazKw)}</td>
                      <td style={tdC}>{row.adet}</td>
                      <td style={tdC}>
                        {row.birimSatis != null
                          ? row.birimSatis.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td style={tdC}>
                        {row.toplamSatis != null
                          ? row.toplamSatis.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td style={tdMarka}>{row.marka}</td>
                      <td style={tdOlcu}>{row.olcu || "—"}</td>
                    </tr>
                    {showSpecRow && (
                      <tr>
                        <td style={specTd} />
                        <td style={specTd} />
                        <td style={specTdFoto}>
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
                              }}
                            />
                          ) : hasKnownProduct ? (
                            row.fotoNot ?? "📷 Fotoğraf"
                          ) : null}
                        </td>
                        <td style={specTdAcik}>
                          <pre style={specPre}>{aciklamaMetni}</pre>
                        </td>
                        <td colSpan={7} style={specTd} />
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </Fragment>
            ))}
            <tr>
              <td colSpan={2} style={td} />
              <td style={td} />
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                Sütun toplamları →
              </td>
              <td style={tdC}>{formatKwHucre(ozet.toplamElektrikKw)}</td>
              <td style={tdC}>{formatKwHucre(ozet.toplamGazKw)}</td>
              <td style={tdC} />
              <td style={{ ...td, fontWeight: 700, textAlign: "center" }}>
                GENEL TOPLAM
              </td>
              <td style={{ ...tdC, fontWeight: 700 }}>
                {ozet.genelToplam != null
                  ? `${ozet.genelToplam.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })} ${ozet.doviz}`
                  : "—"}
              </td>
              <td style={td} />
              <td style={td} />
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
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
            Teklifinizi alın
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            PDF teklifiniz kayıtlı e-posta ve WhatsApp numaranıza gönderilir.
          </Typography.Paragraph>
          <Form form={form} layout="vertical">
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
  tableLayout: "fixed",
};

const thStyle: CSSProperties = {
  textAlign: "center",
  padding: "6px 4px",
  borderBottom: "1px solid #ccc",
  fontWeight: 700,
  fontSize: 10,
  whiteSpace: "nowrap",
};

const thMarkaOlcu: CSSProperties = {
  ...thStyle,
  width: 72,
  padding: "6px 2px",
};

const td: CSSProperties = {
  padding: "5px 4px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};

const tdStok: CSSProperties = {
  ...td,
  textAlign: "left",
  whiteSpace: "nowrap",
  paddingLeft: 2,
};

const tdTanim: CSSProperties = {
  ...td,
  wordBreak: "break-word",
};

const tdMarka: CSSProperties = {
  ...td,
  textAlign: "center",
  fontSize: 10,
  padding: "5px 2px",
};

const tdOlcu: CSSProperties = {
  ...td,
  textAlign: "center",
  fontSize: 10,
  whiteSpace: "nowrap",
  padding: "5px 2px",
};

const tdC: CSSProperties = { ...td, textAlign: "center", whiteSpace: "nowrap" };

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
  textAlign: "left",
  verticalAlign: "middle",
};

/** Açıklama — Tanımı hizası; Poz sütunu kadar iç boşluk */
const specTdAcik: CSSProperties = {
  ...specTd,
  paddingLeft: 0,
};

const specPre: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
};
