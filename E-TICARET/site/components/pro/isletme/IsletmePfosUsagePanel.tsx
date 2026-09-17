"use client";

import { ProTable, StatisticCard } from "@ant-design/pro-components";
import { App, Button, Col, Row, Tag } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  downloadPfosListeKaynak,
  fetchPfosUsage,
  type PfosUsageAdminRow,
  type PfosUsageOzet,
} from "@/lib/pro-admin-client";
import { pfosDisplayText, pfosGuvenYuzdeMetin } from "@/lib/pfos/format-display";
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

function konseptHucre(r: PfosUsageAdminRow) {
  const label = pfosDisplayText(r.konsept_label, "");
  if (label) return label;
  const key = pfosDisplayText(r.konsept, "");
  if (key === "yuklenen-liste") return "Yüklenen ekipman listesi";
  return pfosDisplayText(key);
}

function tutarHucre(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("tr-TR")} ₺`;
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
  const [kaynakId, setKaynakId] = useState<string | null>(null);
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
            render: (_, r) => konseptHucre(r),
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
            render: (v) => tutarHucre(v),
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
            render: (_, r) => {
              const sayi = String(r.teklif_sayi ?? "").trim();
              if (!sayi) return "—";
              return (
                <Link
                  href={`/yonetim/isletme/teklif/${encodeURIComponent(sayi)}`}
                  style={{ fontWeight: 600 }}
                >
                  {sayi}
                </Link>
              );
            },
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
    </>
  );
}
