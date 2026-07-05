"use client";

import { RobotOutlined, SyncOutlined, WarningOutlined } from "@ant-design/icons";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCatalogAgentReport,
  runCatalogAgent,
  type CatalogAgentReport,
  type CatalogIssue,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "blue",
};

const STATUS_COLOR: Record<string, string> = {
  ok: "success",
  info: "processing",
  warn: "warning",
  error: "error",
  skipped: "default",
};

const TYPE_LABEL: Record<string, string> = {
  price_mismatch: "Fiyat sapması",
  price_update: "Güncelleme önerisi",
  missing_source: "Kaynak eksik",
  data_quality: "Veri kalitesi",
  competitor_gap: "Rakip daha ucuz",
  competitor_advantage: "Fiyat avantajı",
};

function fmtTl(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `₺${Math.round(n).toLocaleString("tr-TR")}`;
}

export default function CatalogAgentPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<CatalogAgentReport | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const tablePagination = useAdminTablePagination(15, `${brandFilter}|${severityFilter}`);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCatalogAgentReport();
      setReport(res.report ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRun(withAi: boolean) {
    setRunning(true);
    try {
      const res = await runCatalogAgent({ ai: withAi });
      if (res.error) {
        message.error(res.error);
        return;
      }
      setReport(res.report ?? null);
      message.success(res.message || "Denetim tamamlandı");
    } finally {
      setRunning(false);
    }
  }

  const filteredIssues = useMemo(() => {
    if (!report?.issues) return [];
    return report.issues.filter((i) => {
      if (brandFilter !== "all" && i.brand !== brandFilter) return false;
      if (severityFilter !== "all" && i.severity !== severityFilter) return false;
      return true;
    });
  }, [report, brandFilter, severityFilter]);

  const brands = useMemo(() => {
    if (!report?.summary.byBrand) return [];
    return Object.keys(report.summary.byBrand).sort();
  }, [report]);

  const columns: ProColumns<CatalogIssue>[] = [
    {
      title: "Önem",
      dataIndex: "severity",
      width: 90,
      render: (_, r) => (
        <Tag color={SEVERITY_COLOR[r.severity] || "default"}>{r.severity}</Tag>
      ),
    },
    {
      title: "Marka",
      dataIndex: "brand",
      width: 110,
      render: (v) => <Tag>{String(v)}</Tag>,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      width: 140,
      copyable: true,
    },
    {
      title: "Tür",
      dataIndex: "type",
      width: 130,
      render: (v) => TYPE_LABEL[String(v)] || String(v),
    },
    {
      title: "Sitede",
      dataIndex: "site_tl",
      width: 100,
      render: (_, r) => fmtTl(r.site_tl),
    },
    {
      title: "Beklenen",
      dataIndex: "expected_tl",
      width: 100,
      render: (_, r) => fmtTl(r.expected_tl),
    },
    {
      title: "Rakip",
      dataIndex: "competitor",
      width: 100,
      render: (_, r) =>
        r.competitor ? (
          <span>
            {r.competitor}
            {r.competitor_tl ? ` ${fmtTl(r.competitor_tl)}` : ""}
          </span>
        ) : (
          "—"
        ),
    },
    {
      title: "Açıklama",
      dataIndex: "message",
      ellipsis: true,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        icon={<RobotOutlined />}
        message="Katalog Ajanı"
        description="Şenox, Yüksel İthal, Portabianco fiyat denetimi ve Rational rakip karşılaştırmasını birleştirir. TCMB kuru ile formül kontrolü yapar; Cafemarkt/Mutbex/Akakçe verilerini kullanır."
      />

      <ProCard
        title="Denetim"
        extra={
          <Space wrap>
            <Button icon={<SyncOutlined />} loading={running} onClick={() => onRun(false)}>
              Denetimi çalıştır
            </Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={running}
              onClick={() => onRun(true)}
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
                <Statistic title="Toplam sorun" value={report.issueCount} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Kritik / Yüksek"
                  value={(report.summary.high || 0) + (report.summary.critical || 0)}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Kur (EUR)"
                  value={report.kur}
                  suffix={report.kurFallback ? "yedek" : "TCMB"}
                  precision={2}
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
                    {chk.total != null ? ` (${chk.total})` : ""}
                  </Tag>
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <Typography.Text type="secondary">
            Henüz rapor yok. &quot;Denetimi çalıştır&quot; ile ilk taramayı başlatın.
          </Typography.Text>
        )}
      </ProCard>

      {report && report.issues.length > 0 ? (
        <ProTable<CatalogIssue>
          rowKey="id"
          headerTitle="Sorunlar"
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
                  type={brandFilter === "all" ? "primary" : "default"}
                  onClick={() => setBrandFilter("all")}
                >
                  Tüm markalar
                </Button>
                {brands.map((b) => (
                  <Button
                    key={b}
                    size="small"
                    type={brandFilter === b ? "primary" : "default"}
                    onClick={() => setBrandFilter(b)}
                  >
                    {b} ({report.summary.byBrand[b]})
                  </Button>
                ))}
                <Button
                  size="small"
                  type={severityFilter === "high" ? "primary" : "default"}
                  onClick={() =>
                    setSeverityFilter(severityFilter === "high" ? "all" : "high")
                  }
                >
                  Yüksek+
                </Button>
              </Space>
            ),
          }}
        />
      ) : null}
    </Space>
  );
}
