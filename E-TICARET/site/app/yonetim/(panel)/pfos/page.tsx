"use client";

import {
  AppstoreOutlined,
  CalculatorOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  ExportOutlined,
  FileAddOutlined,
  ProjectOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Alert, Button, Col, Row, Space, Tabs, Typography } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProToken } from "@/lib/pro-admin-client";
import PfosExportPanel from "@/components/pfos/pro/PfosExportPanel";
import PfosImportPanel from "@/components/pfos/pro/PfosImportPanel";
import PfosKategoriPanel from "@/components/pfos/pro/PfosKategoriPanel";
import PfosProjeAkisPanel from "@/components/pfos/pro/PfosProjeAkisPanel";
import PfosProjeList from "@/components/pfos/pro/PfosProjeList";
import PfosProWizard from "@/components/pfos/pro/PfosProWizard";
import PfosSogukOdaPanel from "@/components/pfos/pro/PfosSogukOdaPanel";
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
        setCounts({
          questions: data?.questions?.length ?? 0,
          rules: data?.rules?.length ?? 0,
          products: data?.products?.length ?? 0,
          sets: data?.eqSets?.length ?? 0,
          types: data?.shopTypes?.length ?? 0,
        });
        const empty =
          !data?.questions?.length &&
          !data?.shopTypes?.length &&
          !data?.products?.length;
        if (err && empty) setError(err);
      })
      .catch(() => {
        setError("Proje akışı verisi yüklenemedi");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={error}
          description={
            error.toLowerCase().includes("yetkisiz") ? (
              <Space direction="vertical" size={4}>
                <span>
                  Kayıt için Bearer gerekir; okuma genelde{" "}
                  <code>/data/proje-akis.json</code> üzerinden yapılır.
                </span>
                <Link href="/yonetim/giris">Yönetim girişi → Bearer token</Link>
                {!getProToken() && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Yerel: <code>.env</code> içindeki{" "}
                    <code>EQUSTO_ADMIN_BEARER</code> değerini yapıştırın.
                  </Typography.Text>
                )}
              </Space>
            ) : undefined
          }
        />
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
        title="Legacy admin"
        style={{ marginTop: 16 }}
        extra={<ToolOutlined />}
      >
        <Typography.Paragraph>
          Import, export ve soğuk oda hesabı bu panelde. Soru editörü ve kural
          setleri için hâlâ <strong>admin.html</strong> kullanılabilir. Canlı
          müşteri: <strong>/pfos</strong>.
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
          <Button href="/pfos" target="_blank">
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
            key: "import",
            label: (
              <span>
                <CloudUploadOutlined /> Import
              </span>
            ),
            children: <PfosImportPanel />,
          },
          {
            key: "export",
            label: (
              <span>
                <CloudDownloadOutlined /> Export
              </span>
            ),
            children: <PfosExportPanel />,
          },
          {
            key: "soguk-oda",
            label: (
              <span>
                <CalculatorOutlined /> Soğuk oda
              </span>
            ),
            children: <PfosSogukOdaPanel />,
          },
          {
            key: "kategoriler",
            label: (
              <span>
                <AppstoreOutlined /> Kategoriler
              </span>
            ),
            children: <PfosKategoriPanel />,
          },
          {
            key: "proje-akis",
            label: "Proje akışı (A) · Set & Kural",
            children: <PfosProjeAkisPanel />,
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
