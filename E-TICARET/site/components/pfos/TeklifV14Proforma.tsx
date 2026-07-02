"use client";

import { DislikeOutlined, DownloadOutlined, LikeOutlined, MailOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Checkbox, Collapse, Form, Input, Modal, Typography } from "antd";
import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import { groupTeklifV14Satirlar } from "@/lib/pfos/teklif/group-v14-bolumler";
import { formatTarihTr, formatKwHucre, formatEurHucre, formatTeklifDovizHucre } from "@/lib/pfos/teklif/format-v14";
import { downloadTeklifV14Excel } from "@/lib/pfos/teklif/export-teklif-v14.client";
import { printTeklifV14 } from "@/lib/pfos/teklif/print-teklif-v14.client";
import { sanitizeTeklifV14SatirTanim } from "@/lib/pfos/teklif/sanitize-teklif-v14-export";
import { TEKLIF_V14_FORM_NO, TEKLIF_BOLUM_ROW_FILL } from "@/lib/pfos/teklif/constants";
import { normalizeTeklifAciklamaText } from "@/lib/pfos/teklif/catalog-teklif-aciklama";
import {
  memberLoggedInNow,
  pfosLoginHref,
  pfosRegisterHref,
} from "@/lib/pfos/member-session.client";
import PfosKonseptEkipmanGrid from "@/components/pfos/PfosKonseptEkipmanGrid";
import { buildListeKalemWhatsAppUrl } from "@/lib/pfos/teklif/liste-kalem-whatsapp.client";
import { trackPfosListeWhatsApp } from "@/lib/pfos/track-pfos-analytics.client";
import { logPfosTeklifFeedback } from "@/lib/pfos/log-pfos-feedback.client";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import { savePfosTeklifSnapshot } from "@/lib/pfos/log-pfos-snapshot.client";

type Props = {
  model: TeklifModelV14;
  /** Halk PFOS: yalnızca e-posta / WhatsApp ile PDF; indirme yok */
  deliveryOnly?: boolean;
  /** PFOS kullanım istatistiği — wizard | liste */
  pfosSource?: "wizard" | "liste";
  /** Şartlarımızdan sonra konsepte uygun e-ticaret vitrini */
  projeEkipman?: {
    dukkanTuru: string;
    ustSegment?: string;
    konseptLabel?: string;
  };
};

type SendKanal = "email" | "whatsapp";

type TeklifFeedback = "up" | "down";

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
  "Ölçü",
  "Marka",
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
  equstoTrackEvent?: (name: string, params?: Record<string, unknown>) => void;
};

export default function TeklifV14Proforma({
  model,
  deliveryOnly = false,
  pfosSource = "wizard",
  projeEkipman,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [sendingKanal, setSendingKanal] = useState<SendKanal | null>(null);
  const [sendResult, setSendResult] = useState<
    DeliveryResult | { kind: "err"; message: string } | null
  >(null);
  const [teklifFeedback, setTeklifFeedback] = useState<TeklifFeedback | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [downModalOpen, setDownModalOpen] = useState(false);
  const [selectedPozs, setSelectedPozs] = useState<string[]>([]);
  const [feedbackYorum, setFeedbackYorum] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");
  const [registerHref, setRegisterHref] = useState("/login?mode=register");
  const [form] = Form.useForm<{
    ad: string;
    telefon: string;
    eposta: string;
    not?: string;
  }>();
  const { ust, ozet, meta } = model;
  const { t } = usePfosLabel();
  const blocks = groupTeklifV14Satirlar(model.satirlar);
  const tarih = formatTarihTr(ust.tarih);

  const pozSecenekleri = useMemo(
    () =>
      model.satirlar
        .filter((s) => s.poz.trim())
        .map((s) => ({
          poz: s.poz,
          label: `${s.poz} — ${s.tanim.slice(0, 72)}${s.tanim.length > 72 ? "…" : ""}`,
        })),
    [model.satirlar],
  );

  useEffect(() => {
    if (!ust.sayi?.trim()) return;
    void savePfosTeklifSnapshot(model).then((id) => {
      if (id) setSnapshotId(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- teklif no başına bir snapshot
  }, [ust.sayi]);

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
    const syncMember = () => setMemberLoggedIn(memberLoggedInNow());
    syncMember();
    setLoginHref(pfosLoginHref());
    setRegisterHref(pfosRegisterHref());
    document.addEventListener("equsto-member-session", syncMember);
    document.addEventListener("equsto-member-changed", syncMember);
    return () => {
      document.removeEventListener("equsto-member-session", syncMember);
      document.removeEventListener("equsto-member-changed", syncMember);
    };
  }, [deliveryOnly]);

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

  useEffect(() => {
    if (!deliveryOnly || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`pfos_teklif_fb_${ust.sayi}`);
      if (saved === "up" || saved === "down") setTeklifFeedback(saved);
    } catch {
      /* ignore */
    }
  }, [deliveryOnly, ust.sayi]);

  async function sendFeedbackToApi(
    vote: TeklifFeedback,
    opts?: { kalemDuzeltmeleri?: { poz: string; referansIsim?: string; yanlisSku?: string | null; yanlisAd?: string | null; sorunTipi?: string }[]; yorum?: string },
  ) {
    await logPfosTeklifFeedback({
      vote,
      model,
      source: pfosSource,
      snapshotId,
      yorum: opts?.yorum ?? null,
      kalemDuzeltmeleri: opts?.kalemDuzeltmeleri,
    });
  }

  function markFeedbackLocal(vote: TeklifFeedback) {
    setTeklifFeedback(vote);
    try {
      localStorage.setItem(`pfos_teklif_fb_${ust.sayi}`, vote);
    } catch {
      /* ignore */
    }
    const w = window as EqustoMemberWindow;
    const payload = {
      vote,
      teklif: ust.sayi,
      konsept: meta.konsept,
      konsept_label: meta.konseptLabel,
      genel_toplam: ozet.genelToplam,
      doviz: ozet.doviz,
    };
    w.equstoTrackEvent?.("pfos_teklif_feedback", payload);
    w.equstoTrackConversion?.("pfos_teklif_feedback", payload);
  }

  async function submitTeklifFeedback(vote: TeklifFeedback) {
    if (teklifFeedback) return;
    if (vote === "down") {
      setSelectedPozs([]);
      setFeedbackYorum("");
      setDownModalOpen(true);
      return;
    }
    markFeedbackLocal(vote);
    void sendFeedbackToApi(vote);
  }

  async function confirmDownFeedback() {
    if (teklifFeedback || feedbackSending) return;
    setFeedbackSending(true);
    try {
      const kalemDuzeltmeleri = selectedPozs.map((poz) => {
        const satir = model.satirlar.find((s) => s.poz === poz);
        const pk = model.pfos?.kalemler?.find((k) => k.poz === poz);
        return {
          poz,
          referansIsim: pk?.isim ?? satir?.tanim,
          yanlisSku: pk?.sku ?? satir?.stokNo ?? null,
          yanlisAd: pk?.ad ?? satir?.tanim ?? null,
          sorunTipi: "genel",
        };
      });
      markFeedbackLocal("down");
      await sendFeedbackToApi("down", {
        kalemDuzeltmeleri,
        yorum: feedbackYorum,
      });
      setDownModalOpen(false);
    } finally {
      setFeedbackSending(false);
    }
  }

  async function skipDownDetails() {
    if (teklifFeedback || feedbackSending) return;
    setFeedbackSending(true);
    try {
      markFeedbackLocal("down");
      await sendFeedbackToApi("down");
      setDownModalOpen(false);
    } finally {
      setFeedbackSending(false);
    }
  }

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
      window.location.href = pfosLoginHref();
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
          pfos_source: pfosSource,
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
    <div
      style={{
        fontFamily: "Arial, system-ui, sans-serif",
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(12px) saturate(120%)",
        WebkitBackdropFilter: "blur(12px) saturate(120%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.03)",
        color: "#1e293b",
      }}
    >
      <span style={{ display: "none" }} aria-hidden="true">
        {eqSk}
      </span>
      <div
        style={{
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          paddingBottom: 16,
          marginBottom: 16,
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
            <col style={{ width: "31%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "4%" }} />
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
                  const fiyatsizSatir = row.birimSatis == null;
                  const aciklamaMetni = normalizeTeklifAciklamaText(row.aciklama);
                  const showSpecRow =
                    Boolean(aciklamaMetni) ||
                    Boolean(row.fotoUrl) ||
                    hasKnownProduct ||
                    fiyatsizSatir;
                  return (
                  <Fragment key={`${row.poz}-${i}`}>
                    <tr style={fiyatsizSatir ? { backgroundColor: "#fffbeb" } : undefined}>
                      <td style={tdBolPoz}>{row.bolumNo}</td>
                      <td style={tdBolPoz}>{row.poz}</td>
                      <td style={tdStok}>{row.stokNo}</td>
                      <td style={tdTanim}>
                        {sanitizeTeklifV14SatirTanim(row.tanim)}
                      </td>
                      <td style={tdOlcu}>{row.olcu || "—"}</td>
                      <td style={tdMarka}>{row.marka}</td>
                      <td style={tdC}>{formatKwHucre(row.elkKw)}</td>
                      <td style={tdC}>{formatKwHucre(row.gazKw)}</td>
                      <td style={tdC}>{row.adet}</td>
                      <td style={tdFiyat}>
                        {formatEurHucre(row.birimSatis)}
                      </td>
                      <td style={tdFiyat}>
                        {formatEurHucre(row.toplamSatis)}
                      </td>
                    </tr>
                    {showSpecRow && (
                      <tr>
                        <td colSpan={COLS.length} style={specTdStack}>
                          <div style={specStack}>
                            {row.fotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.fotoUrl}
                                alt=""
                                style={{
                                  maxWidth: 150,
                                  maxHeight: 125,
                                  objectFit: "contain",
                                  display: "block",
                                }}
                              />
                            ) : hasKnownProduct && !aciklamaMetni ? (
                              row.fotoNot ?? "📷 Fotoğraf"
                            ) : null}
                            {aciklamaMetni ? (
                              <pre style={specPre}>{aciklamaMetni}</pre>
                            ) : null}
                            {fiyatsizSatir && pfosSource === "liste" ? (
                              <a
                                href={buildListeKalemWhatsAppUrl({
                                  poz: row.poz,
                                  tanim: row.tanim,
                                  teklifSayi: ust.sayi,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={listeWaCtaLink}
                                onClick={() =>
                                  trackPfosListeWhatsApp({
                                    scope: "satir",
                                    poz: row.poz,
                                    teklifSayi: ust.sayi,
                                  })
                                }
                              >
                                {t("Bu kalem için WhatsApp ile yazın")}
                              </a>
                            ) : null}
                          </div>
                        </td>
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
              <td style={td} />
              <td style={td} />
              <td style={td} />
              <td style={tdC}>{formatKwHucre(ozet.toplamElektrikKw)}</td>
              <td style={tdC}>{formatKwHucre(ozet.toplamGazKw)}</td>
              <td style={tdC} />
              <td style={{ ...td, fontWeight: 700, textAlign: "center" }}>
                GENEL TOPLAM
              </td>
              <td style={{ ...tdFiyat, fontWeight: 700 }}>
                {formatTeklifDovizHucre(ozet.genelToplam, ozet.doviz)}
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
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
            Teklifinizi alın
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            PDF teklifiniz kayıtlı e-posta ve WhatsApp numaranıza gönderilir.
          </Typography.Paragraph>
          {memberLoggedIn ? (
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
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #d9f7be",
              }}
            >
              <Typography.Text
                type="secondary"
                style={{ display: "block", marginBottom: 8, fontSize: 13 }}
              >
                Bu teklif size yardımcı oldu mu?
              </Typography.Text>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  icon={<LikeOutlined />}
                  type={teklifFeedback === "up" ? "primary" : "default"}
                  onClick={() => submitTeklifFeedback("up")}
                  disabled={teklifFeedback !== null}
                  aria-label="Beğendim"
                />
                <Button
                  icon={<DislikeOutlined />}
                  danger={teklifFeedback === "down"}
                  type={teklifFeedback === "down" ? "primary" : "default"}
                  onClick={() => submitTeklifFeedback("down")}
                  disabled={teklifFeedback !== null}
                  aria-label="Beğenmedim"
                />
                {teklifFeedback ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Teşekkürler — geri bildiriminiz kaydedildi.
                  </Typography.Text>
                ) : null}
              </div>
            </div>
          </Form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                PDF teklifinizi almak için Equsto hesabınızla giriş yapın.
              </Typography.Paragraph>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button type="primary" href={loginHref}>
                  Üye Girişi
                </Button>
                <Button href={registerHref}>Kayıt ol</Button>
              </div>
            </div>
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

      {projeEkipman ? (
        <PfosKonseptEkipmanGrid
          dukkanTuru={projeEkipman.dukkanTuru}
          ustSegment={projeEkipman.ustSegment}
          konseptLabel={projeEkipman.konseptLabel}
          layout="rows"
          limit={5}
        />
      ) : null}

      <Modal
        title="Hangi satırlar yanlış?"
        open={downModalOpen}
        onCancel={() => setDownModalOpen(false)}
        footer={[
          <Button key="skip" onClick={skipDownDetails} disabled={feedbackSending}>
            Atla
          </Button>,
          <Button
            key="ok"
            type="primary"
            loading={feedbackSending}
            onClick={() => void confirmDownFeedback()}
          >
            Gönder
          </Button>,
        ]}
        zIndex={14000}
        getContainer={() => document.body}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          En fazla 3 poz seçebilirsiniz (isteğe bağlı).
        </Typography.Paragraph>
        <Checkbox.Group
          style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}
          value={selectedPozs}
          onChange={(vals) => setSelectedPozs((vals as string[]).slice(0, 3))}
          options={pozSecenekleri.map((o) => ({ label: o.label, value: o.poz }))}
        />
        <Input.TextArea
          rows={3}
          placeholder="Kısa not (isteğe bağlı)"
          value={feedbackYorum}
          onChange={(e) => setFeedbackYorum(e.target.value)}
          maxLength={500}
        />
      </Modal>

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
  padding: "10px 8px",
  borderBottom: "2px solid #cbd5e1",
  background: "rgba(241, 245, 249, 0.45)",
  fontWeight: 600,
  fontSize: 10,
  color: "#475569",
  whiteSpace: "nowrap",
};

const thMarkaOlcu: CSSProperties = {
  ...thStyle,
  padding: "10px 8px",
};

const td: CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
  verticalAlign: "middle",
};

const tdStok: CSSProperties = {
  ...td,
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 0,
  fontSize: 10,
  paddingLeft: 4,
  paddingRight: 4,
};

const tdTanim: CSSProperties = {
  ...td,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  overflow: "hidden",
  minWidth: 0,
};

const tdMarka: CSSProperties = {
  ...td,
  textAlign: "center",
  fontSize: 10,
  padding: "10px 4px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 0,
};

const tdOlcu: CSSProperties = {
  ...td,
  textAlign: "center",
  fontSize: 10,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 0,
  padding: "10px 8px",
};

const tdBolPoz: CSSProperties = { ...td, textAlign: "center", whiteSpace: "nowrap" };

const tdC: CSSProperties = { ...td, textAlign: "center", whiteSpace: "nowrap" };

const tdFiyat: CSSProperties = {
  ...tdC,
  padding: "10px 10px",
  fontVariantNumeric: "tabular-nums",
};

const sectionTd: CSSProperties = {
  padding: "10px 12px",
  fontWeight: 700,
  background: "linear-gradient(90deg, #e6f4ea 0%, rgba(230, 244, 234, 0.4) 100%)",
  borderBottom: "1px solid #b7dfc5",
  borderLeft: "4px solid #34a853",
  color: "#137333",
  borderRadius: "4px 4px 0 0",
};

const specTd: CSSProperties = {
  padding: "8px 4px",
  borderBottom: "1px solid #eee",
  background: "#fafafa",
  fontSize: 10,
  verticalAlign: "top",
};

const specTdStack: CSSProperties = {
  ...specTd,
  padding: "8px 12px",
};

const specStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
  maxWidth: "100%",
};

const specPre: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  fontSize: 10,
  lineHeight: 1.45,
  wordBreak: "break-word",
  width: "100%",
};

const listeWaCtaLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  marginTop: 4,
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  color: "#166534",
  background: "#ecfdf5",
  border: "1px solid #86efac",
  textDecoration: "none",
};
