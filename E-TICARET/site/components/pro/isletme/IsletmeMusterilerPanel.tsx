"use client";

import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { App, Button, Popconfirm, Space, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  deleteMusteri,
  fetchMusteriler,
  fetchSiparisler,
  fetchTeklifler,
  type MusteriAdminRow,
  saveMusteri,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

export default function IsletmeMusterilerPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MusteriAdminRow[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<MusteriAdminRow | null>(null);
  const tablePagination = useAdminTablePagination();
  const [siparisCount, setSiparisCount] = useState<Record<string, number>>({});
  const [teklifCount, setTeklifCount] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s, t] = await Promise.all([
        fetchMusteriler(),
        fetchSiparisler(),
        fetchTeklifler(),
      ]);
      if (m.error) message.warning(m.error);
      setRows(m.rows);

      const sc: Record<string, number> = {};
      for (const row of s.rows) {
        const key = (row.musteri_tel || row.musteri_ad).toLowerCase();
        if (key) sc[key] = (sc[key] || 0) + 1;
      }
      setSiparisCount(sc);

      const tc: Record<string, number> = {};
      for (const row of t.rows) {
        const key = row.musteri_ad.toLowerCase();
        if (key) tc[key] = (tc[key] || 0) + 1;
      }
      setTeklifCount(tc);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  function waLink(tel: string) {
    const d = tel.replace(/\D/g, "");
    if (!d) return null;
    const e164 = d.startsWith("90") ? d : `90${d.replace(/^0/, "")}`;
    return `https://wa.me/${e164}`;
  }

  function formatTrDate(iso: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  const sortedRows = [...rows].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
  );

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => { setEditRow(null); setEditOpen(true); }}>
          Müşteri ekle
        </Button>
        <Button onClick={load}>Yenile</Button>
      </Space>

      <ProTable<MusteriAdminRow>
        rowKey="id"
        loading={loading}
        search={{ labelWidth: "auto" }}
        options={false}
        pagination={tablePagination}
        dataSource={sortedRows}
        columns={[
          {
            title: "Tarih",
            dataIndex: "created_at",
            width: 150,
            render: (_, r) => formatTrDate(r.created_at),
          },
          { title: "Firma", dataIndex: "firma" },
          { title: "Yetkili", dataIndex: "yetkili" },
          {
            title: "Telefon",
            dataIndex: "tel",
            render: (tel) => {
              const link = waLink(String(tel || ""));
              return link ? (
                <a href={link} target="_blank" rel="noreferrer">
                  {tel}
                </a>
              ) : (
                tel || "—"
              );
            },
          },
          { title: "E-posta", dataIndex: "mail", ellipsis: true },
          { title: "Şehir", dataIndex: "sehir" },
          {
            title: "Kaynak",
            dataIndex: "kaynak",
            width: 120,
            render: (v) => (v ? <Tag>{String(v)}</Tag> : "—"),
          },
          {
            title: "Mesaj",
            dataIndex: "mesaj",
            ellipsis: true,
            render: (_, r) => String(r.mesaj || r.not || "").trim() || "—",
          },
          {
            title: "Tip",
            dataIndex: "tip",
            render: (v) => <Tag>{v || "lead"}</Tag>,
          },
          {
            title: "Sip / Teklif",
            render: (_, r) => {
              const k = (r.tel || r.yetkili || r.firma).toLowerCase();
              const nameK = (r.yetkili || r.firma).toLowerCase();
              return `${siparisCount[k] || 0} / ${teklifCount[nameK] || 0}`;
            },
          },
          {
            title: "İşlem",
            render: (_, r) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditRow(r);
                    setEditOpen(true);
                  }}
                >
                  Düzenle
                </Button>
                <Popconfirm
                  title="Müşteri silinsin mi?"
                  onConfirm={async () => {
                    const res = await deleteMusteri(r.id);
                    if (!res.ok) message.error(res.error);
                    else {
                      message.success("Silindi");
                      load();
                    }
                  }}
                >
                  <Button size="small" danger>
                    Sil
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <ModalForm
        title={editRow ? "Müşteri düzenle" : "Yeni müşteri"}
        open={editOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditOpen(false) }}
        initialValues={editRow ?? { tip: "lead" }}
        onFinish={async (vals) => {
          const res = await saveMusteri(vals as MusteriAdminRow, editRow?.id);
          if (!res.ok) {
            message.error(res.error);
            return false;
          }
          message.success("Kaydedildi");
          setEditOpen(false);
          load();
          return true;
        }}
      >
        <ProFormText name="firma" label="Firma" />
        <ProFormText name="yetkili" label="Yetkili" rules={[{ required: true }]} />
        <ProFormText name="tel" label="Telefon" />
        <ProFormText name="mail" label="E-posta" />
        <ProFormText name="sehir" label="Şehir" />
        <ProFormSelect
          name="tip"
          label="Tip"
          options={[
            { value: "lead", label: "Lead" },
            { value: "musteri", label: "Müşteri" },
            { value: "bayi", label: "Bayi" },
          ]}
        />
        <ProFormTextArea name="not" label="Not" />
        <ProFormTextArea name="mesaj" label="Mesaj" fieldProps={{ readOnly: !!editRow }} />
      </ModalForm>
    </>
  );
}
