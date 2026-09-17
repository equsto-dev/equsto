"use client";

import { ProTable } from "@ant-design/pro-components";
import { App, Button, Select, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  downloadPfosListeKaynak,
  downloadTeklifExcel,
  fetchTeklifler,
  type TeklifAdminRow,
  updateTeklifDurum,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

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
  const [excelId, setExcelId] = useState<string | null>(null);
  const [kaynakId, setKaynakId] = useState<string | null>(null);
  const tablePagination = useAdminTablePagination();

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

  const onExcel = useCallback(
    async (row: TeklifAdminRow) => {
      const hint = (row.teklif_sayi || row.ref_no || row.id).trim();
      setExcelId(row.id);
      try {
        const res = await downloadTeklifExcel(row.id, hint);
        if (res.error) message.error(res.error);
        else message.success("Excel indirildi");
      } finally {
        setExcelId(null);
      }
    },
    [message],
  );

  const onKaynak = useCallback(
    async (uploadId: string, filename?: string | null) => {
      const id = uploadId.trim();
      if (!id) return;
      setKaynakId(id);
      try {
        const res = await downloadPfosListeKaynak(id, filename || undefined);
        if (res.error) message.error(res.error);
        else message.success("Orijinal dosya indirildi");
      } finally {
        setKaynakId(null);
      }
    },
    [message],
  );

  return (
    <ProTable<TeklifAdminRow>
      rowKey="id"
      loading={loading}
      search={false}
      options={false}
      pagination={tablePagination}
      headerTitle="Teklifler (PFOS + admin)"
      toolBarRender={() => [
        <a key="reload" onClick={load}>
          Yenile
        </a>,
      ]}
      dataSource={rows}
      columns={[
        {
          title: "Teklif no",
          dataIndex: "teklif_sayi",
          ellipsis: true,
          render: (_, r) => {
            const eqs = String(r.teklif_sayi ?? "").trim();
            const label = eqs || r.ref_no;
            return (
              <div>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto" }}
                  loading={excelId === r.id}
                  onClick={() => void onExcel(r)}
                >
                  {label}
                </Button>
                {eqs && eqs !== r.ref_no ? (
                  <div style={{ fontSize: 11, color: "#888" }}>{r.ref_no}</div>
                ) : null}
              </div>
            );
          },
        },
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
        {
          title: "Orijinal",
          dataIndex: "kaynak_dosya",
          ellipsis: true,
          render: (_, r) => {
            const id = String(r.kaynak_yukleme_id ?? "").trim();
            const name = String(r.kaynak_dosya ?? "").trim();
            if (!id) return "—";
            return (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: "auto" }}
                loading={kaynakId === id}
                onClick={() => void onKaynak(id, name)}
              >
                {name || "İndir"}
              </Button>
            );
          },
        },
      ]}
    />
  );
}
