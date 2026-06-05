"use client";

import { ProTable } from "@ant-design/pro-components";
import { App, Select, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  fetchTeklifler,
  type TeklifAdminRow,
  updateTeklifDurum,
} from "@/lib/pro-admin-client";

const DURUM_OPTIONS = [
  { value: "taslak", label: "Taslak" },
  { value: "gonderildi", label: "Gönderildi" },
  { value: "onaylandi", label: "Onaylandı" },
  { value: "reddedildi", label: "Reddedildi" },
  { value: "revize", label: "Revize" },
  { value: "iptal", label: "İptal" },
];

export default function IsletmeTekliflerPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeklifAdminRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeklifler();
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
    const res = await updateTeklifDurum(id, durum);
    if (!res.ok) {
      message.error(res.error || "Güncellenemedi");
      return;
    }
    message.success("Durum güncellendi");
    load();
  }

  return (
    <ProTable<TeklifAdminRow>
      rowKey="id"
      loading={loading}
      search={false}
      options={false}
      pagination={{ pageSize: 20 }}
      headerTitle="Teklifler (PFOS + admin)"
      toolBarRender={() => [
        <a key="reload" onClick={load}>
          Yenile
        </a>,
      ]}
      dataSource={rows}
      columns={[
        { title: "Ref", dataIndex: "ref_no" },
        { title: "Müşteri", dataIndex: "musteri_ad" },
        { title: "Konsept", dataIndex: "konsept", ellipsis: true },
        {
          title: "Tutar",
          dataIndex: "toplam_tl",
          render: (v) => `${Number(v).toLocaleString("tr-TR")} ₺`,
        },
        {
          title: "Geçerlilik",
          dataIndex: "gecerlilik_bitis",
          render: (v) => (v ? new Date(String(v)).toLocaleDateString("tr-TR") : "—"),
        },
        {
          title: "Tarih",
          dataIndex: "created_at",
          render: (v) => new Date(String(v)).toLocaleDateString("tr-TR"),
        },
        {
          title: "Durum",
          dataIndex: "durum",
          render: (d, r) => (
            <Select
              size="small"
              value={String(d)}
              style={{ minWidth: 120 }}
              options={DURUM_OPTIONS}
              onChange={(v) => onDurumChange(r.id, v)}
            />
          ),
        },
        {
          title: "Kaynak",
          dataIndex: "kaynak",
          render: (v) => <Tag>{v || "pfos"}</Tag>,
        },
      ]}
    />
  );
}
