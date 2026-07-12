"use client";

import { GlobalOutlined, SyncOutlined } from "@ant-design/icons";
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
  fetchEnAgentReport,
  runEnAgent,
  type EnAgentReport,
  type EnIssue,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "blue",
  info: "default",
};

const AREA_LABEL: Record<string, string> = {
  ui: "UI çevirileri",
  products: "Ürün kapsamı",
  quality: "Çeviri kalitesi",
  geo: "GEO sayfalar",
  sitemap: "Sitemap",
  discovery: "llms.txt",
  seo: "SEO kodu",
  live: "Canlı site",
};

export default function EnAgentPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<EnAgentReport | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const tablePagination = useAdminTablePagination(15, areaFilter);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEnAgentReport();
      setReport(res.report ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRun(opts: { ai?: boolean; skipLive?: boolean }) {
    setRunning(true);
    try {
      const res = await runEnAgent(opts);
      if (res.error) {
        message.error(res.error);
        return;
      }
      setReport(res.report ?? null);
      message.success(res.message || "EN denetimi tamamlandı");
    } finally {
      setRunning(false);
    }
  }

  const filteredIssues = useMemo(() => {
    if (!report?.issues) return [];
    return report.issues.filter((i) => areaFilter === "all" || i.area === areaFilter);
  }, [report, areaFilter]);

  const areas = useMemo(() => {
    if (!report?.summary.byArea) return [];
    return Object.keys(report.summary.byArea).sort();
  }, [report]);

  const columns: ProColumns<EnIssue>[] = [
    {
      title: "Önem",
      dataIndex: "severity",
      width: 88,
      render: (_, r) => (
        <Tag color={SEVERITY_COLOR[r.severity] || "default"}>{r.severity}</Tag>
      ),
    },
    {
      title: "Alan",
      dataIndex: "area",
      width: 120,
      render: (v) => AREA_LABEL[String(v)] || String(v),
    },
    {
      title: "Bulgu",
      dataIndex: "message",
      ellipsis: true,
    },
    {
      title: "Öneri",
      dataIndex: "fix",
      width: 200,
      ellipsis: true,
      render: (v) => v || "—",
    },
  ];

  const productCov = report?.checks?.product_coverage as
    | { catalogCount?: number; enCount?: number }
    | undefined;

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<GlobalOutlined />}
        message="İngilizce Sayfa Ajanı"
        description="/en rotaları, ürün çevirileri (9.905 SKU), UI i18n, GEO eşlemesi, sitemap, canonical/hreflang ve çeviri kalitesini denetler; geliştirme planı üretir."
      />

      <ProCard
        title="Denetim"
        extra={
          <Space wrap>
            <Button
              icon={<SyncOutlined />}
              loading={running}
              onClick={() => onRun({ skipLive: true })}
            >
              Yerel denetim
            </Button>
            <Button loading={running} onClick={() => onRun({ skipLive: false })}>
              + Canlı EN
            </Button>
            <Button
              type="primary"
              icon={<GlobalOutlined />}
              loading={running}
              onClick={() => onRun({ ai: true, skipLive: false })}
            >
              Çalıştır + AI özet
            </Button>
          </Space>
        }
        loading={loading && !report}
      >
        {report ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Durum"
                  value={report.status.toUpperCase()}
                  valueStyle={{
                    color:
                      report.status === "ok"
                        ? "#3f8600"
                        : report.status === "error"
                          ? "#cf1322"
                          : "#d48806",
                  }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Bulgu" value={report.issueCount} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Ürün EN"
                  value={`${productCov?.enCount ?? "?"} / ${productCov?.catalogCount ?? "?"}`}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="UI eksik anahtar"
                  value={Number(report.checks.ui_i18n?.missing ?? 0)}
                />
              </Col>
            </Row>

            <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              Son çalıştırma: {new Date(report.generatedAt).toLocaleString("tr-TR")} ·{" "}
              {report.durationMs}ms
            </Typography.Text>

            {report.aiSummary ? (
              <Alert
                style={{ marginTop: 16 }}
                type="success"
                showIcon
                message="AI Özet — EN geliştirme"
                description={
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                    {report.aiSummary}
                  </Typography.Paragraph>
                }
              />
            ) : null}

            <ProCard title="Geliştirme planı" size="small" style={{ marginTop: 16 }} bordered>
              <List
                size="small"
                dataSource={report.improvementPlan.actions}
                renderItem={(a) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Space wrap>
                        <Tag
                          color={
                            a.priority === "critical"
                              ? "red"
                              : a.priority === "high"
                                ? "orange"
                                : "blue"
                          }
                        >
                          {a.priority}
                        </Tag>
                        <Typography.Text code>{a.action}</Typography.Text>
                      </Space>
                      <Typography.Text type="secondary">{a.reason}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
              <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Komutlar: {report.improvementPlan.recommendedCommands.join(" · ")}
              </Typography.Text>
            </ProCard>

            <ProCard title="Öncelikli EN sayfalar" size="small" style={{ marginTop: 12 }} bordered>
              <List
                size="small"
                dataSource={report.improvementPlan.priorityPages}
                renderItem={(p) => (
                  <List.Item>
                    <Typography.Link href={p.path} target="_blank">
                      {p.path}
                    </Typography.Link>
                    <Tag>{p.role}</Tag>
                  </List.Item>
                )}
              />
            </ProCard>
          </>
        ) : (
          <Typography.Text type="secondary">
            Henüz rapor yok. Denetimi çalıştırarak EN kapsam analizini başlatın.
          </Typography.Text>
        )}
      </ProCard>

      {report && report.issues.length > 0 ? (
        <ProTable<EnIssue>
          rowKey="id"
          headerTitle="Bulgular"
          dataSource={filteredIssues}
          columns={columns}
          search={false}
          options={{ density: true, reload: () => load() }}
          pagination={tablePagination}
          toolbar={{
            filter: (
              <Space wrap>
                <Button
                  size="small"
                  type={areaFilter === "all" ? "primary" : "default"}
                  onClick={() => setAreaFilter("all")}
                >
                  Tümü
                </Button>
                {areas.map((a) => (
                  <Button
                    key={a}
                    size="small"
                    type={areaFilter === a ? "primary" : "default"}
                    onClick={() => setAreaFilter(a)}
                  >
                    {AREA_LABEL[a] || a} ({report.summary.byArea[a]})
                  </Button>
                ))}
              </Space>
            ),
          }}
        />
      ) : null}
    </Space>
  );
}
