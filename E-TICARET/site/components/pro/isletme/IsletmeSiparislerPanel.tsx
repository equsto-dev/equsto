"use client";

import { ProTable } from "@ant-design/pro-components";
import { App, Button, Drawer, Select, Space, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import AdminAlanFormu, { type AlanSection } from "@/components/pro/isletme/AdminAlanFormu";
import { mailHref, telHref, waHref } from "@/lib/isletme/iletisim-link";
import { parseSiparisNot } from "@/lib/isletme/parse-siparis-not";
import { siparisNotBolumleri } from "@/lib/isletme/siparis-not-alanlari";
import {
  captureSiparisOdeme,
  fetchSiparis,
  fetchSiparisler,
  type SiparisAdminRow,
  updateSiparisDurum,
  voidSiparisOdeme,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const DURUM_OPTIONS = [
  { value: "beklemede", label: "Beklemede", color: "default" },
  { value: "hazirlaniyor", label: "Hazırlanıyor", color: "processing" },
  { value: "kargoda", label: "Kargoda", color: "blue" },
  { value: "teslim", label: "Teslim", color: "success" },
  { value: "iptal", label: "İptal", color: "error" },
];

const ODEME_LABEL: Record<string, { label: string; color: string }> = {
  yok: { label: "Ödeme yok", color: "default" },
  bekliyor: { label: "Ödeme bekliyor", color: "warning" },
  provizyon: { label: "Provizyon", color: "processing" },
  tahsil: { label: "Ödendi", color: "success" },
  iptal: { label: "Ödeme iptal", color: "error" },
  basarisiz: { label: "Ödeme başarısız", color: "error" },
  iade: { label: "İade", color: "purple" },
};

function durumTag(d: string) {
  const row = DURUM_OPTIONS.find((x) => x.value === d);
  return <Tag color={row?.color}>{row?.label || d}</Tag>;
}

function odemeTag(d?: string) {
  const key = d || "yok";
  const row = ODEME_LABEL[key] || { label: key, color: "default" };
  return <Tag color={row.color}>{row.label}</Tag>;
}

function siparisFormu(detail: SiparisAdminRow): AlanSection[] {
  const tel = String(detail.musteri_tel || "").trim();
  const mail = String(detail.musteri_mail || "").trim();
  const ad = detail.musteri_ad || "Müşteri";
  const wa = waHref(tel, "Merhaba equsto.com Adem ben, talebiniz için yazıyorum");
  const call = telHref(tel);
  const mailTo = mailHref(mail, detail.siparis_no);
  const musteri: AlanSection = {
    title: "Müşteri",
    headline: ad,
    facts: [
      ...(tel ? [{ label: "Telefon", value: tel, copyText: tel }] : []),
      ...(mail ? [{ label: "E-posta", value: mail, copyText: mail }] : []),
    ],
    actions: [
      ...(wa ? [{ label: "WhatsApp'ta yaz", href: wa, tone: "wa" as const }] : []),
      ...(call ? [{ label: "Ara", href: call, tone: "call" as const }] : []),
      ...(mailTo ? [{ label: "E-posta yaz", href: mailTo, tone: "mail" as const }] : []),
    ],
  };
  return [musteri, ...siparisNotBolumleri(parseSiparisNot(detail.not_))];
}

export default function IsletmeSiparislerPanel() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SiparisAdminRow[]>([]);
  const [detail, setDetail] = useState<SiparisAdminRow | null>(null);
  const [odemeBusy, setOdemeBusy] = useState(false);
  const tablePagination = useAdminTablePagination();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSiparisler();
      if (res.error) message.warning(res.error);
      setRows(res.rows);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDurumChange(id: string, durum: string) {
    const res = await updateSiparisDurum(id, durum);
    if (!res.ok) {
      message.error(res.error || "Güncellenemedi");
      return;
    }
    message.success("Durum güncellendi");
    load();
    if (detail?.id === id) {
      const d = await fetchSiparis(id);
      if (d.row) setDetail(d.row);
    }
  }

  async function openDetail(id: string) {
    const res = await fetchSiparis(id);
    if (res.error || !res.row) {
      message.error(res.error || "Detay alınamadı");
      return;
    }
    setDetail(res.row);
  }

  async function onCapture() {
    if (!detail) return;
    modal.confirm({
      title: "Ödemeyi çek (tahsilat)",
      content:
        "Provizyon onaylanacak ve tutar karttan tahsil edilecek. Fiyat doğruysa devam edin.",
      okText: "Çek",
      cancelText: "Vazgeç",
      onOk: async () => {
        setOdemeBusy(true);
        try {
          const res = await captureSiparisOdeme(detail.id);
          if (!res.ok) {
            message.error(res.error || "Tahsilat başarısız");
            return;
          }
          message.success("Tahsilat tamamlandı");
          if (res.row) setDetail(res.row);
          load();
        } finally {
          setOdemeBusy(false);
        }
      },
    });
  }

  async function onVoid() {
    if (!detail) return;
    modal.confirm({
      title: "Provizyonu iptal et",
      content:
        "Karttaki bloke kaldırılır; para çekilmez. Yanlış fiyat / iptal için kullanın.",
      okText: "İptal et",
      okButtonProps: { danger: true },
      cancelText: "Vazgeç",
      onOk: async () => {
        setOdemeBusy(true);
        try {
          const res = await voidSiparisOdeme(detail.id);
          if (!res.ok) {
            message.error(res.error || "İptal başarısız");
            return;
          }
          message.success("Provizyon iptal edildi");
          if (res.row) setDetail(res.row);
          load();
        } finally {
          setOdemeBusy(false);
        }
      },
    });
  }

  return (
    <>
      <ProTable<SiparisAdminRow>
        rowKey="id"
        loading={loading}
        search={false}
        options={false}
        pagination={tablePagination}
        headerTitle="Siparişler"
        toolBarRender={() => [
          <a key="reload" onClick={load}>
            Yenile
          </a>,
        ]}
        dataSource={rows}
        columns={[
          {
            title: "No",
            dataIndex: "siparis_no",
            render: (_, r) => (
              <Typography.Link onClick={() => openDetail(r.id)}>{r.siparis_no}</Typography.Link>
            ),
          },
          { title: "Müşteri", dataIndex: "musteri_ad" },
          {
            title: "Tutar",
            dataIndex: "toplam_tl",
            render: (v) => `${Number(v).toLocaleString("tr-TR")} ₺`,
          },
          {
            title: "Ödeme",
            dataIndex: "odeme_durum",
            render: (d) => odemeTag(String(d || "yok")),
          },
          {
            title: "Tarih",
            dataIndex: "created_at",
            render: (v) => new Date(String(v)).toLocaleString("tr-TR"),
          },
          {
            title: "Durum",
            dataIndex: "durum",
            render: (d, r) => (
              <Select
                size="small"
                value={String(d)}
                style={{ minWidth: 130 }}
                options={DURUM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                onChange={(v) => onDurumChange(r.id, v)}
              />
            ),
          },
          { title: "Kaynak", dataIndex: "kaynak", render: (v) => v || "—" },
        ]}
      />

      <Drawer
        title={detail ? `Sipariş ${detail.siparis_no}` : "Detay"}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={640}
      >
        {detail && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              {durumTag(detail.durum)} {odemeTag(detail.odeme_durum)} · {detail.kaynak || "web"}
            </div>
            {detail.odeme_durum === "provizyon" && detail.odeme_gateway === "iyzico" && (
              <Space wrap>
                <Button type="primary" loading={odemeBusy} onClick={onCapture}>
                  Ödemeyi çek (onayla)
                </Button>
                <Button danger loading={odemeBusy} onClick={onVoid}>
                  Provizyonu iptal et
                </Button>
              </Space>
            )}
            {detail.odeme_gateway === "tepeplatform" && detail.odeme_durum === "bekliyor" && (
              <Typography.Text type="secondary">
                Müşteri ödeme sayfasında; sonuç webhook ile güncellenir.
              </Typography.Text>
            )}
            {detail.odeme_durum === "tahsil" && (
              <Typography.Text type="success">Kart ödemesi alındı.</Typography.Text>
            )}
            {detail.kupon_kod && (
              <Tag color="gold">
                Kupon: {detail.kupon_kod}
                {detail.indirim_tl ? ` (−${detail.indirim_tl} ₺)` : ""}
              </Tag>
            )}
            <AdminAlanFormu sections={siparisFormu(detail)} />
            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                Kalemler ({detail.toplam_kalem})
              </Typography.Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => String(i)}
                dataSource={(detail.kalemler || []) as Record<string, unknown>[]}
                columns={[
                  {
                    title: "Ürün",
                    dataIndex: "ad",
                    render: (ad, row) => (
                      <span>
                        {String(ad ?? "—")}
                        {row.marka ? (
                          <Typography.Text type="secondary"> · {String(row.marka)}</Typography.Text>
                        ) : null}
                      </span>
                    ),
                  },
                  {
                    title: "Adet",
                    dataIndex: "adet",
                    width: 64,
                    render: (adet) => Number(adet ?? 1),
                  },
                  {
                    title: "Tutar",
                    dataIndex: "birim_fiyat_tl",
                    width: 120,
                    align: "right",
                    render: (fiyat, row) => {
                      const adet = Number(row.adet ?? 1);
                      const birim = Number(fiyat ?? 0);
                      return `${(adet * birim).toLocaleString("tr-TR")} ₺`;
                    },
                  },
                ]}
              />
              <Typography.Text strong style={{ display: "block", marginTop: 10 }}>
                Toplam: {detail.toplam_tl.toLocaleString("tr-TR")} ₺ ({detail.toplam_adet} adet)
              </Typography.Text>
            </div>
          </Space>
        )}
      </Drawer>
    </>
  );
}
