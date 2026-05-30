"use client";

import { ExportOutlined, FileAddOutlined, ProjectOutlined, ToolOutlined } from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Alert, Button, Col, Row, Space, Tabs, Typography } from "antd";
import { useEffect, useState } from "react";
import PfosProjeList from "@/components/pfos/pro/PfosProjeList";
import PfosProWizard from "@/components/pfos/pro/PfosProWizard";
import { fetchProjeAkis } from "@/lib/pro-admin-client";

function PfosOzetPanel() {
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
    <>
      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Sorular", value: counts.questions }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Kurallar", value: counts.rules }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "PFOS ürün", value: counts.products }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Setler", value: counts.sets }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Konsept", value: counts.types }}
          />
        </Col>
      </Row>

      <ProCard
        title="Tam PFOS düzenleme (legacy)"
        style={{ marginTop: 16 }}
        extra={<ToolOutlined />}
      >
        <Typography.Paragraph>
          PDF/Excel import, soru editörü ve kural setleri hâlâ{" "}
          <strong>admin.html</strong> içinde. Teklif motoru ve sihirbaz bu panelde
          (Ant Design Pro); canlı müşteri sayfası geçiş sürecinde{" "}
          <strong>pfos.html</strong>.
        </Typography.Paragraph>
        <Space wrap>
          <Button
            type="default"
            icon={<ExportOutlined />}
            href="/admin.html"
            target="_blank"
          >
            PFOS Admin (HTML)
          </Button>
          <Button href="/pfos.html" target="_blank">
            Canlı PFOS (müşteri)
          </Button>
          <Button href="/yonetim/yayin">Yayınlama</Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16, marginBottom: 0 }}
          message="API"
          description={
            <>
              Motor:{" "}
              <Typography.Text code>POST /api/pfos/quote</Typography.Text> · Veri
              akışı:{" "}
              <Typography.Text code>GET/POST /api/proje-akis</Typography.Text>
            </>
          }
        />
      </ProCard>
    </>
  );
}

export default function YonetimPfosPage() {
  return (
    <PageContainer
      title="Proje Fabrikası (PFOS)"
      subTitle="Teklif çıktısı: Excel proforma"
    >
      <Tabs
        defaultActiveKey="teklif"
        items={[
          {
            key: "teklif",
            label: (
              <span>
                <FileAddOutlined /> Teklif oluştur
              </span>
            ),
            children: <PfosProWizard />,
          },
          {
            key: "projeler",
            label: (
              <span>
                <ProjectOutlined /> Mutfak projeleri
              </span>
            ),
            children: <PfosProjeList />,
          },
          {
            key: "ozet",
            label: "Özet & legacy",
            children: <PfosOzetPanel />,
          },
        ]}
      />
    </PageContainer>
  );
}
