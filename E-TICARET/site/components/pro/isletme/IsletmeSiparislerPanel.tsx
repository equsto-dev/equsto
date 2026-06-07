"use client";

import { ProTable } from "@ant-design/pro-components";
import { App, Drawer, Select, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  fetchSiparis,
  fetchSiparisler,
  type SiparisAdminRow,
  updateSiparisDurum,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const DURUM_OPTIONS = [
  { value: "beklemede", label: "Beklemede", color: "default" },
  { value: "hazirlaniyor", label: "Hazırlanıyor", color: "processing" },
  { value: "kargoda", label: "Kargoda", color: "blue" },
  { value: "teslim", label: "Teslim", color: "success" },
  { value: "iptal", label: "İptal", color: "error" },
];

function durumTag(d: string) {
  const row = DURUM_OPTIONS.find((x) => x.value === d);
  return <Tag color={row?.color}>{row?.label || d}</Tag>;
}

export default function IsletmeSiparislerPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SiparisAdminRow[]>([]);
  const [detail, setDetail] = useState<SiparisAdminRow | null>(null);
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
  }

  async function openDetail(id: string) {
    const res = await fetchSiparis(id);
    if (res.error || !res.row) {
      message.error(res.error || "Detay alınamadı");
      return;
    }
    setDetail(res.row);
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
        width={560}
      >
        {detail && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              {durumTag(detail.durum)} · {detail.kaynak || "web"}
            </div>
            <Typography.Text>
              <strong>{detail.musteri_ad}</strong>
              <br />
              {detail.musteri_tel} · {detail.musteri_mail || "—"}
            </Typography.Text>
            {detail.not_ && (
              <Typography.Paragraph type="secondary">Not: {detail.not_}</Typography.Paragraph>
            )}
            {detail.kupon_kod && (
              <Tag color="gold">
                Kupon: {detail.kupon_kod}
                {detail.indirim_tl ? ` (−${detail.indirim_tl} ₺)` : ""}
              </Tag>
            )}
            <Typography.Title level={5}>Kalemler ({detail.toplam_kalem})</Typography.Title>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {(detail.kalemler || []).map((k, i) => {
                const row = k as Record<string, unknown>;
                return (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {String(row.ad ?? "—")} · {String(row.marka ?? "")} ·{" "}
                    {Number(row.adet ?? 1)} × {Number(row.birim_fiyat_tl ?? 0).toLocaleString("tr-TR")} ₺
                  </li>
                );
              })}
            </ul>
            <Typography.Text strong>
              Toplam: {detail.toplam_tl.toLocaleString("tr-TR")} ₺ ({detail.toplam_adet} adet)
            </Typography.Text>
          </Space>
        )}
      </Drawer>
    </>
  );
}
