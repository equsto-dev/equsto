"use client";

import { ExportOutlined, ToolOutlined } from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Alert, Button, Col, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { fetchProjeAkis } from "@/lib/pro-admin-client";

export default function YonetimPfosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    questions: 0,
    rules: 0,
    products: 0,
    sets: 0,
    types: 0,
  });

  useEffect(() => {
    fetchProjeAkis()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err);
          return;
        }
        setCounts({
          questions: data?.questions?.length ?? 0,
          rules: data?.rules?.length ?? 0,
          products: data?.products?.length ?? 0,
          sets: data?.eqSets?.length ?? 0,
          types: data?.shopTypes?.length ?? 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer
      title="Proje Fabrikası (PFOS)"
      subTitle="Soru akışı, kurallar ve teklif motoru — admin verisi"
      loading={loading}
    >
      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard statistic={{ title: "Sorular", value: counts.questions }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard statistic={{ title: "Kurallar", value: counts.rules }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard statistic={{ title: "PFOS ürün", value: counts.products }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard statistic={{ title: "Setler", value: counts.sets }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard statistic={{ title: "Konsept", value: counts.types }} />
        </Col>
      </Row>

      <ProCard
        title="Tam PFOS düzenleme"
        style={{ marginTop: 16 }}
        extra={<ToolOutlined />}
      >
        <Typography.Paragraph>
          PDF/Excel import, soru editörü, kural setleri ve ekipman setleri şu an{" "}
          <strong>admin.html</strong> içinde (binlerce satır, onaylı iş akışı). Ant
          Design Pro paneline adım adım taşınacak; şimdilik tek tıkla aynı veriye
          erişin.
        </Typography.Paragraph>
        <Space wrap>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            href="/admin.html"
            target="_blank"
          >
            PFOS Admin (tam panel)
          </Button>
          <Button href="/pfos.html" target="_blank">
            Canlı PFOS (müşteri)
          </Button>
          <Button href="/yonetim/yayin">Yayınlama adımları</Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16, marginBottom: 0 }}
          message="API"
          description={
            <>
              Veri: <Typography.Text code>GET/POST /api/proje-akis</Typography.Text>{" "}
              → <Typography.Text code>data/proje-akis.json</Typography.Text>
            </>
          }
        />
      </ProCard>
    </PageContainer>
  );
}
