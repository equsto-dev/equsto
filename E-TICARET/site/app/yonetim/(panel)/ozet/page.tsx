"use client";

import {
  PageContainer,
  ProCard,
  StatisticCard,
} from "@ant-design/pro-components";
import { Col, Row, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  fetchCatalogStats,
  fetchKur,
  fetchSearchCheck,
  fetchUrunler,
} from "@/lib/pro-admin-client";

const { Statistic } = StatisticCard;

export default function YonetimOzetPage() {
  const [loading, setLoading] = useState(true);
  const [urunCount, setUrunCount] = useState(0);
  const [urunSource, setUrunSource] = useState("—");
  const [catalog, setCatalog] = useState({ ekipmanlar: 0, withImage: 0, brands: 0 });
  const [searchOk, setSearchOk] = useState(false);
  const [kur, setKur] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [urun, cat, search, kurRes] = await Promise.all([
          fetchUrunler(),
          fetchCatalogStats().catch(() => ({
            ekipmanlar: 0,
            withImage: 0,
            brands: 0,
          })),
          fetchSearchCheck(),
          fetchKur(),
        ]);
        if (cancelled) return;
        setUrunCount(urun.rows.length);
        setUrunSource(urun.source);
        setCatalog(cat);
        setSearchOk(!!search.configured);
        setKur(kurRes.rate ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer
      title="Özet"
      subTitle="Sayılar ve hızlı bakış"
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard statistic={{ title: "Vitrin ürünü", value: catalog.ekipmanlar }} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard statistic={{ title: "Görselli", value: catalog.withImage }} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard statistic={{ title: "Marka", value: catalog.brands }} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: "EUR/TRY",
              value: kur != null ? kur.toFixed(4) : "—",
            }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <ProCard title="API ürünler" bordered>
            <Statistic title="Kayıt" value={urunCount} />
            <Typography.Text type="secondary">Kaynak: {urunSource}</Typography.Text>
          </ProCard>
        </Col>
        <Col xs={24} md={12}>
          <ProCard title="Meilisearch" bordered>
            <Statistic
              title="Yapılandırma"
              value={searchOk ? "Hazır" : "Eksik"}
              valueStyle={{ color: searchOk ? "#3f8600" : "#cf1322" }}
            />
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              İndeks: <code>equsto_products</code>
            </Typography.Paragraph>
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
