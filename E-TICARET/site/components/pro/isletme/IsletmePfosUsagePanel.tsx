"use client";

import { ProTable, StatisticCard } from "@ant-design/pro-components";
import { App, Col, Row, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  fetchPfosUsage,
  type PfosUsageAdminRow,
  type PfosUsageOzet,
} from "@/lib/pro-admin-client";
import { pfosGuvenYuzdeMetin } from "@/lib/pfos/format-display";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

function eventLabel(event: string) {
  if (event === "quote_sent") return "PDF gönderildi";
  if (event === "quote_generated") return "Teklif üretildi";
  return event;
}

function sourceLabel(source: string) {
  if (source === "liste") return "Liste yükle";
  if (source === "wizard") return "Konsept sihirbazı";
  return source || "—";
}

function feedbackVoteTag(vote: string | null | undefined) {
  if (vote === "up") return <Tag color="green">👍</Tag>;
  if (vote === "down") return <Tag color="red">👎</Tag>;
  return <Tag color="default">—</Tag>;
}

export default function IsletmePfosUsagePanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [ozet, setOzet] = useState<PfosUsageOzet | null>(null);
  const [rows, setRows] = useState<PfosUsageAdminRow[]>([]);
  const [days, setDays] = useState(30);
  const tablePagination = useAdminTablePagination();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPfosUsage(days);
      if (res.error) message.warning(res.error);
      setOzet(res.ozet ?? null);
      setRows(res.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [days, message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: `Teklif üretildi (${days} gün)`,
              value: ozet?.uretildi ?? 0,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "PDF gönderildi",
              value: ozet?.gonderildi ?? 0,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Dönüşüm (gönder / üret)",
              value: ozet ? `${ozet.donusum_yuzde}%` : "—",
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Memnuniyet (👍 / oy)",
              value:
                ozet?.memnuniyet_yuzde != null
                  ? `${ozet.memnuniyet_yuzde}%`
                  : "—",
              description: ozet
                ? `👍 ${ozet.feedback_up ?? 0} · 👎 ${ozet.feedback_down ?? 0}`
                : undefined,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Düşük güven + 👎",
              value: ozet?.dusuk_guven_down ?? 0,
              description: "Öncelikli inceleme adayı",
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Anonim kullanım",
              value: ozet?.anonim ?? 0,
              description: ozet
                ? `Sihirbaz ${ozet.wizard} · Liste ${ozet.liste}`
                : undefined,
            }}
          />
        </Col>
      </Row>

      <ProTable<PfosUsageAdminRow>
        rowKey="id"
        loading={loading}
        search={false}
        options={false}
        pagination={tablePagination}
        headerTitle="PFOS kullanım + geri bildirim"
        toolBarRender={() => [
          <a key="d7" onClick={() => setDays(7)}>
            7 gün
          </a>,
          <a key="d30" onClick={() => setDays(30)}>
            30 gün
          </a>,
          <a key="d90" onClick={() => setDays(90)}>
            90 gün
          </a>,
          <a key="reload" onClick={load}>
            Yenile
          </a>,
        ]}
        dataSource={rows}
        columns={[
          {
            title: "Tarih",
            dataIndex: "created_at",
            render: (v) =>
              new Date(String(v)).toLocaleString("tr-TR", {
                dateStyle: "short",
                timeStyle: "short",
              }),
          },
          {
            title: "Olay",
            dataIndex: "event",
            render: (v) => (
              <Tag color={v === "quote_sent" ? "green" : "blue"}>
                {eventLabel(String(v))}
              </Tag>
            ),
          },
          {
            title: "Kaynak",
            dataIndex: "source",
            render: (v) => sourceLabel(String(v)),
          },
          {
            title: "Konsept",
            dataIndex: "konsept_label",
            ellipsis: true,
            render: (v, r) => String(v || r.konsept || "—"),
          },
          {
            title: "Güven",
            dataIndex: "feedback_guven",
            width: 72,
            render: (v) =>
              pfosGuvenYuzdeMetin(v != null ? Number(v) : null),
          },
          {
            title: "Oy",
            dataIndex: "feedback_vote",
            width: 56,
            render: (v) => feedbackVoteTag(v != null ? String(v) : null),
          },
          {
            title: "m²",
            dataIndex: "m2",
            width: 64,
            render: (v) => (v != null ? String(v) : "—"),
          },
          {
            title: "Kalem",
            dataIndex: "kalem_sayisi",
            width: 64,
          },
          {
            title: "Tutar",
            dataIndex: "toplam_try",
            render: (v) =>
              v != null ? `${Number(v).toLocaleString("tr-TR")} ₺` : "—",
          },
          {
            title: "Üye",
            dataIndex: "member_logged_in",
            width: 72,
            render: (v) => (v ? "Evet" : "Hayır"),
          },
          {
            title: "Teklif no",
            dataIndex: "teklif_sayi",
            ellipsis: true,
          },
        ]}
      />
    </>
  );
}
