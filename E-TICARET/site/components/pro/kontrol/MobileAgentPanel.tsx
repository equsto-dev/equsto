"use client";

import { AndroidOutlined, AppleOutlined, MobileOutlined, SyncOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { ProCard, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchMobileAgentReport,
  runMobileAgent,
  type MobileAgentReport,
  type MobileIssue,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "blue",
  info: "default",
};

const PLATFORM_ICON: Record<string, ReactNode> = {
  ios: <AppleOutlined />,
  android: <AndroidOutlined />,
  pwa: <MobileOutlined />,
};

const STATUS_COLOR: Record<string, string> = {
  ok: "success",
  warn: "warning",
  error: "error",
  skipped: "default",
  info: "processing",
};

export default function MobileAgentPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<MobileAgentReport | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [hideInfo, setHideInfo] = useState(true);
  const tablePagination = useAdminTablePagination(15, `${platformFilter}|${hideInfo}`);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMobileAgentReport();
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
      const res = await runMobileAgent(opts);
      if (res.error) {
        message.error(res.error);
        return;
      }
      setReport(res.report ?? null);
      message.success(res.message || "Mobil denetim tamamlandı");
    } finally {
      setRunning(false);
    }
  }

  const filteredIssues = useMemo(() => {
    if (!report?.issues) return [];
    return report.issues.filter((i) => {
      if (hideInfo && i.severity === "info") return false;
      if (platformFilter !== "all" && i.platform !== platformFilter) return false;
      return true;
    });
  }, [report, platformFilter, hideInfo]);

  const platforms = useMemo(() => {
    if (!report?.summary.byPlatform) return [];
    return Object.keys(report.summary.byPlatform).sort();
  }, [report]);

  const columns: ProColumns<MobileIssue>[] = [
    {
      title: "Önem",
      dataIndex: "severity",
      width: 88,
      render: (_, r) => (
        <Tag color={SEVERITY_COLOR[r.severity] || "default"}>{r.severity}</Tag>
      ),
    },
    {
      title: "Platform",
      dataIndex: "platform",
      width: 100,
      render: (_, r) => (
        <Space size={4}>
          {PLATFORM_ICON[String(r.platform)] || <MobileOutlined />}
          {String(r.platform)}
        </Space>
      ),
    },
    {
      title: "Alan",
      dataIndex: "area",
      width: 110,
    },
    {
      title: "Bulgu",
      dataIndex: "message",
      ellipsis: true,
    },
    {
      title: "Dosya",
      dataIndex: "file",
      width: 160,
      ellipsis: true,
      render: (_, r) =>
        r.file ? <Typography.Text code>{r.file}</Typography.Text> : "—",
    },
    {
      title: "Öneri",
      dataIndex: "fix",
      width: 180,
      ellipsis: true,
      render: (_, r) => r.fix || "—",
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<MobileOutlined />}
        message="Mobil Ajan — Android & iOS"
        description="PWA manifest, Apple meta etiketleri, Android maskable ikon, safe-area CSS, mobil UI kilit scriptleri ve (isteğe bağlı) canlı site head denetimi."
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
              icon={<MobileOutlined />}
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
                <Statistic title="Toplam bulgu" value={report.issueCount} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Kritik / Yüksek"
                  value={(report.summary.high || 0) + (report.summary.critical || 0)}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="iOS" value={report.summary.byPlatform?.ios || 0} prefix={<AppleOutlined />} />
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
                message="AI Özet"
                description={
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                    {report.aiSummary}
                  </Typography.Paragraph>
                }
              />
            ) : null}

            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              {Object.entries(report.checks).map(([key, chk]) => (
                <Col key={key}>
                  <Tag color={STATUS_COLOR[chk.status] || "default"}>
                    {key}: {chk.status}
                  </Tag>
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <Typography.Text type="secondary">
            Henüz rapor yok. Yerel veya canlı denetim ile başlatın.
          </Typography.Text>
        )}
      </ProCard>

      {report && report.issues.length > 0 ? (
        <ProTable<MobileIssue>
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
                  type={platformFilter === "all" ? "primary" : "default"}
                  onClick={() => setPlatformFilter("all")}
                >
                  Tümü
                </Button>
                {platforms.map((p) => (
                  <Button
                    key={p}
                    size="small"
                    type={platformFilter === p ? "primary" : "default"}
                    onClick={() => setPlatformFilter(p)}
                  >
                    {p} ({report.summary.byPlatform[p]})
                  </Button>
                ))}
                <Button
                  size="small"
                  type={hideInfo ? "primary" : "default"}
                  onClick={() => setHideInfo((v) => !v)}
                >
                  {hideInfo ? "Bilgi gizli" : "Tümü göster"}
                </Button>
              </Space>
            ),
          }}
        />
      ) : null}
    </Space>
  );
}
