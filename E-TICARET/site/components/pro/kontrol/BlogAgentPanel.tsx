"use client";

import { EditOutlined, FileTextOutlined, SyncOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { ProCard, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Col,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchBlogAgentReport,
  publishBlogDraft,
  runBlogAgent,
  type BlogAgentReport,
  type BlogDraft,
  type TopicGap,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const PRIORITY_COLOR: Record<string, string> = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "blue",
  info: "default",
};

export default function BlogAgentPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [report, setReport] = useState<BlogAgentReport | null>(null);
  const tablePagination = useAdminTablePagination(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBlogAgentReport();
      setReport(res.report ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRun(opts: { ai?: boolean; force?: boolean; topicId?: string }) {
    setRunning(true);
    try {
      const res = await runBlogAgent(opts);
      if (res.error) {
        message.error(res.error);
        return;
      }
      setReport(res.report ?? null);
      message.success(res.message || "Blog ajanı tamamlandı");
    } finally {
      setRunning(false);
    }
  }

  async function onPublish(slug: string) {
    setPublishing(slug);
    try {
      const res = await publishBlogDraft(slug);
      if (res.error) {
        message.error(res.error);
        return;
      }
      message.success(res.message || "Yayınlandı");
      await load();
    } finally {
      setPublishing(null);
    }
  }

  const gapColumns: ProColumns<TopicGap>[] = [
    {
      title: "Öncelik",
      dataIndex: "priority",
      width: 88,
      render: (_, r) => (
        <Tag color={PRIORITY_COLOR[r.priority] || "default"}>{r.priority}</Tag>
      ),
    },
    {
      title: "Konu",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Kategori",
      dataIndex: "category",
      width: 110,
    },
    {
      title: "Rakip",
      dataIndex: "competitorSites",
      width: 140,
      render: (_, r) => (r.competitorSites || []).join(", "),
    },
    {
      title: "",
      width: 100,
      render: (_, r) => (
        <Button size="small" loading={running} onClick={() => onRun({ topicId: r.id, force: true })}>
          Taslak
        </Button>
      ),
    },
  ];

  const draftColumns: ProColumns<BlogDraft>[] = [
    {
      title: "Başlık",
      dataIndex: "h1",
      ellipsis: true,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      width: 200,
      render: (v) => (
        <Typography.Link href={`/rehber/${v}`} target="_blank">
          /rehber/{v}
        </Typography.Link>
      ),
    },
    {
      title: "Durum",
      dataIndex: "status",
      width: 100,
      render: (v) => (
        <Tag color={v === "published" ? "success" : "processing"}>{String(v)}</Tag>
      ),
    },
    {
      title: "",
      width: 110,
      render: (_, r) =>
        r.status !== "published" ? (
          <Button
            size="small"
            type="primary"
            loading={publishing === r.slug}
            onClick={() => onPublish(r.slug)}
          >
            Yayınla
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  const latest = report?.latestDraft;
  const weekly = report?.summary;

  const aiNote = useMemo(() => {
    const st = report?.checks?.ai as { status?: string; message?: string } | undefined;
    return st?.message || "";
  }, [report]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        message="Blog Ajanı"
        description="Endüstriyel mutfak sitelerindeki blog konularını analiz eder, Equsto'da eksik başlıkları bulur ve haftada 1 rehber taslağı üretir. Yayın öncesi admin onayı önerilir."
      />

      <ProCard
        title="Haftalık içerik"
        loading={loading}
        extra={
          <Space wrap>
            <Button icon={<SyncOutlined />} loading={running} onClick={() => onRun({})}>
              Haftalık çalıştır
            </Button>
            <Button loading={running} onClick={() => onRun({ force: true })}>
              Zorla taslak
            </Button>
            <Button loading={running} onClick={() => onRun({ ai: true })}>
              + AI özet
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Statistic title="Rakip konu" value={weekly?.competitorTopics ?? "—"} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Equsto rehber" value={weekly?.equstoArticles ?? "—"} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Boşluk" value={weekly?.gapTopics ?? "—"} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={`Hafta ${weekly?.currentWeek ?? ""}`}
              value={weekly?.weeklyDraftCreated ? "Taslak ✓" : "Bekliyor"}
            />
          </Col>
        </Row>
        {aiNote ? (
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
            {aiNote}
          </Typography.Paragraph>
        ) : null}
      </ProCard>

      {latest ? (
        <ProCard title="Son taslak" extra={<Tag icon={<EditOutlined />}>{latest.source || "draft"}</Tag>}>
          <Typography.Title level={5}>{latest.h1}</Typography.Title>
          <Typography.Paragraph type="secondary">{latest.description}</Typography.Paragraph>
          <Space>
            <Button href={`/rehber/${latest.slug}`} target="_blank">
              Önizleme (taslak dosyasından henüz yayında olmayabilir)
            </Button>
            {latest.status !== "published" ? (
              <Button
                type="primary"
                loading={publishing === latest.slug}
                onClick={() => onPublish(latest.slug)}
              >
                geo-landings.json'a yayınla
              </Button>
            ) : (
              <Tag color="success">Yayında</Tag>
            )}
          </Space>
        </ProCard>
      ) : null}

      {report?.aiSummary ? (
        <ProCard title="AI özeti">
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {report.aiSummary}
          </Typography.Paragraph>
        </ProCard>
      ) : null}

      <ProCard title="Konu boşlukları (rakip analizi)">
        <ProTable<TopicGap>
          rowKey="id"
          search={false}
          options={false}
          pagination={tablePagination}
          dataSource={report?.gapTopics ?? []}
          columns={gapColumns}
          loading={loading}
        />
      </ProCard>

      <ProCard title="Taslak kuyruğu">
        <ProTable<BlogDraft>
          rowKey="id"
          search={false}
          options={false}
          pagination={{ pageSize: 8 }}
          dataSource={report?.drafts ?? []}
          columns={draftColumns}
          loading={loading}
        />
      </ProCard>

      {report?.checks?.competitor_seed ? (
        <ProCard title="Rakip kaynakları">
          <List
            size="small"
            dataSource={
              (report.checks.competitor_seed as { sources?: string[] }).sources || []
            }
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </ProCard>
      ) : null}
    </Space>
  );
}
