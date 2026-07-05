"use client";

import { GoogleOutlined, SyncOutlined } from "@ant-design/icons";
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
  fetchGoogleAdsAgentReport,
  runGoogleAdsAgent,
  type GoogleAdsAgentReport,
  type GoogleAdsIssue,
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
  gtag: "Etiketler",
  conversion: "Dönüşüm",
  positioning: "Konumlandırma",
  merchant: "Merchant",
  landing: "Landing",
  consent: "KVKK/Çerez",
  live: "Canlı site",
};

export default function GoogleAdsAgentPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<GoogleAdsAgentReport | null>(null);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const tablePagination = useAdminTablePagination(15, areaFilter);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGoogleAdsAgentReport();
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
      const res = await runGoogleAdsAgent(opts);
      if (res.error) {
        message.error(res.error);
        return;
      }
      setReport(res.report ?? null);
      message.success(res.message || "Google Ads denetimi tamamlandı");
    } finally {
      setRunning(false);
    }
  }

  const filteredIssues = useMemo(() => {
    if (!report?.issues) return [];
    return report.issues.filter((i) => {
      if (areaFilter !== "all" && i.area !== areaFilter) return false;
      return true;
    });
  }, [report, areaFilter]);

  const areas = useMemo(() => {
    if (!report?.summary.byArea) return [];
    return Object.keys(report.summary.byArea).sort();
  }, [report]);

  const columns: ProColumns<GoogleAdsIssue>[] = [
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
      width: 110,
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

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<GoogleOutlined />}
        message="Google Ads Ajan — Endüstriyel Mutfak"
        description="Siteyi Google Ads'te endüstriyel mutfak ekipmanı tedarikçisi olarak konumlandırmak için etiket, dönüşüm, Merchant feed, landing sayfaları ve kampanya önerilerini denetler."
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
              + Canlı site
            </Button>
            <Button
              type="primary"
              icon={<GoogleOutlined />}
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
              <Col xs={24} sm={12}>
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
                  title="Kritik / Yüksek"
                  value={(report.summary.high || 0) + (report.summary.critical || 0)}
                />
              </Col>
            </Row>

            <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
              <Typography.Text strong>İş kategorisi: </Typography.Text>
              {report.campaignConfig.businessCategory}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Son çalıştırma: {new Date(report.generatedAt).toLocaleString("tr-TR")} ·{" "}
              {report.durationMs}ms
            </Typography.Text>

            {report.aiSummary ? (
              <Alert
                style={{ marginTop: 16 }}
                type="success"
                showIcon
                message="AI Özet — Google Ads kurulum"
                description={
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                    {report.aiSummary}
                  </Typography.Paragraph>
                }
              />
            ) : null}

            <ProCard
              title="Önerilen kampanyalar"
              size="small"
              style={{ marginTop: 16 }}
              bordered
            >
              <List
                size="small"
                dataSource={report.campaignConfig.suggestedCampaigns}
                renderItem={(c) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Space wrap>
                        <Tag color="blue">{c.type}</Tag>
                        <Typography.Text strong>{c.name}</Typography.Text>
                      </Space>
                      <Typography.Link href={c.finalUrl} target="_blank">
                        {c.finalUrl}
                      </Typography.Link>
                      {c.keywords?.length ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Anahtar: {c.keywords.join(" · ")}
                        </Typography.Text>
                      ) : null}
                    </Space>
                  </List.Item>
                )}
              />
            </ProCard>

            {report.campaignConfig.feedStats ? (
              <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
                Merchant feed:{" "}
                {String(
                  (report.campaignConfig.feedStats as { included?: number }).included ?? "?",
                )}{" "}
                ürün dahil ·{" "}
                <Typography.Link
                  href={report.campaignConfig.merchantCenter.feedUrl}
                  target="_blank"
                >
                  feed XML
                </Typography.Link>
              </Typography.Text>
            ) : null}
          </>
        ) : (
          <Typography.Text type="secondary">
            Henüz rapor yok. Denetimi çalıştırarak kampanya önerilerini oluşturun.
          </Typography.Text>
        )}
      </ProCard>

      {report && report.issues.length > 0 ? (
        <ProTable<GoogleAdsIssue>
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
