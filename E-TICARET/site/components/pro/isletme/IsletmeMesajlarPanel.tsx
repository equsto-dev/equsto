"use client";

import { ProTable } from "@ant-design/pro-components";
import { App, Button, Space, Tag, Tooltip, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMusteriler, type MusteriAdminRow } from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const KAYNAK_LABEL: Record<string, string> = {
  "whatsapp-modal": "WhatsApp chat",
  "iletisim-fab": "İletişim formu (FAB)",
  "iletisim-sayfa": "İletişim sayfası formu",
  web: "Web",
};

function kaynakTag(kaynak: string | null) {
  const key = String(kaynak || "web").trim();
  const label = KAYNAK_LABEL[key] || key || "—";
  const color =
    key === "whatsapp-modal" ? "green" : key === "iletisim-fab" ? "blue" : "default";
  return <Tag color={color}>{label}</Tag>;
}

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

function isInboxLead(row: MusteriAdminRow) {
  const kaynak = String(row.kaynak || "").trim();
  const mesaj = String(row.mesaj || row.not || "").trim();
  if (mesaj) return true;
  return kaynak === "whatsapp-modal" || kaynak === "iletisim-fab";
}

export default function IsletmeMesajlarPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MusteriAdminRow[]>([]);
  const tablePagination = useAdminTablePagination();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMusteriler();
      if (res.error) message.warning(res.error);
      setRows(res.rows);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const inboxRows = useMemo(
    () =>
      rows
        .filter(isInboxLead)
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
        ),
    [rows],
  );

  return (
    <>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Sitedeki WhatsApp chat ve iletişim formundan gelen mesajlar burada listelenir. Müşteriye
        dönüş için telefon numarasına tıklayıp WhatsApp&apos;ta yazabilirsiniz.
      </Typography.Paragraph>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={load}>
          Yenile
        </Button>
        <Typography.Text type="secondary">
          {inboxRows.length} mesaj
        </Typography.Text>
      </Space>

      <ProTable<MusteriAdminRow>
        rowKey="id"
        loading={loading}
        search={{ labelWidth: "auto" }}
        options={false}
        pagination={tablePagination}
        dataSource={inboxRows}
        locale={{
          emptyText: loading
            ? "Yükleniyor…"
            : "Henüz mesaj yok. Siteden WhatsApp chat veya iletişim formu ile test gönderin.",
        }}
        columns={[
          {
            title: "Tarih",
            dataIndex: "created_at",
            width: 150,
            render: (_, r) => formatTrDate(r.created_at),
            sorter: (a, b) =>
              new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
            defaultSortOrder: "descend",
          },
          {
            title: "Kaynak",
            dataIndex: "kaynak",
            width: 130,
            render: (_, r) => kaynakTag(r.kaynak),
            filters: [
              { text: "WhatsApp chat", value: "whatsapp-modal" },
              { text: "İletişim formu", value: "iletisim-fab" },
              { text: "Web", value: "web" },
            ],
            onFilter: (val, r) => String(r.kaynak || "web") === String(val),
          },
          { title: "Yetkili", dataIndex: "yetkili", width: 140 },
          {
            title: "Telefon",
            dataIndex: "tel",
            width: 130,
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
          { title: "E-posta", dataIndex: "mail", ellipsis: true, width: 180 },
          {
            title: "Mesaj",
            dataIndex: "mesaj",
            ellipsis: true,
            render: (_, r) => {
              const text = String(r.mesaj || r.not || "").trim() || "—";
              return (
                <Tooltip title={text}>
                  <span>{text}</span>
                </Tooltip>
              );
            },
          },
          {
            title: "Sayfa",
            dataIndex: "sayfa",
            ellipsis: true,
            width: 120,
            render: (v) => v || "—",
          },
          {
            title: "İşlem",
            width: 110,
            render: (_, r) => {
              const link = waLink(String(r.tel || ""));
              if (!link) return "—";
              return (
                <Button size="small" href={link} target="_blank" rel="noreferrer">
                  WhatsApp
                </Button>
              );
            },
          },
        ]}
      />
    </>
  );
}
