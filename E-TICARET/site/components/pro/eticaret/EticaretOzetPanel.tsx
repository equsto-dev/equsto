"use client";

import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { Alert, Col, Row, Typography } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCatalogStats,
  fetchEticaretIcerik,
  fetchFiyatlarMap,
  fetchKur,
  fetchSearchCheck,
  type CatalogStats,
} from "@/lib/pro-admin-client";

const EMPTY_CATALOG: CatalogStats = {
  ekipmanlar: 0,
  withImage: 0,
  brands: 0,
  source: "missing",
};

export default function EticaretOzetPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    catalog: EMPTY_CATALOG,
    searchOk: false,
    kur: null as number | null,
    kurDate: "",
    kurFallback: false,
    fiyatKeys: 0,
    kampanya: 0,
    kupon: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cat, search, kurRes, fiyat, eticaret] = await Promise.all([
          fetchCatalogStats().catch(() => EMPTY_CATALOG),
          fetchSearchCheck(),
          fetchKur(),
          fetchFiyatlarMap(),
          fetchEticaretIcerik(),
        ]);
        if (cancelled) return;
        setStats({
          catalog: cat,
          searchOk: !!search.configured,
          kur: kurRes.rate ?? null,
          kurDate: kurRes.date || "",
          kurFallback: kurRes.source === "fallback" || !!kurRes.fallback,
          fiyatKeys: Object.keys(fiyat.map).length,
          kampanya: eticaret.data.k.length,
          kupon: eticaret.data.kp.length,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cat = stats.catalog;

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Katalog ürünü", value: cat.ekipmanlar }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Görselli", value: cat.withImage }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Marka", value: cat.brands }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "EUR/TRY",
              value: stats.kur != null ? stats.kur.toFixed(4) : "—",
            }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Fiyat anahtarı", value: stats.fiyatKeys }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Kampanya / Kupon",
              value: `${stats.kampanya} / ${stats.kupon}`,
            }}
          />
        </Col>
      </Row>

      {stats.kurFallback && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="TCMB kur yedek değer kullanılıyor"
          description="Canlı kur alınamadı; Öztiryakiler EUR fiyatları yedek kurla hesaplanır."
        />
      )}

      {cat.source === "missing" && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          message="Katalog meta eksik"
          description={
            <>
              <Typography.Text code>
                node scripts/rebuild-ekipmanlar-from-dept.mjs
              </Typography.Text>{" "}
              çalıştırın — <Typography.Text code>catalog-meta.json</Typography.Text>{" "}
              oluşur.
            </>
          }
        />
      )}

      {cat.liveDrift != null && cat.liveDrift !== 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="Meta ↔ ekipmanlar.json uyumsuz"
          description={`catalog-meta ${cat.ekipmanlar} satır diyor; ekipmanlar.json fark: ${cat.liveDrift > 0 ? "+" : ""}${cat.liveDrift}. Rebuild çalıştırın.`}
        />
      )}

      {cat.productsEnStale != null && cat.productsEnStale > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="EN çeviri geride"
          description={
            <>
              <strong>{cat.productsEnStale}</strong> ürün — deploy veya{" "}
              <Typography.Text code>
                node scripts/build-product-i18n-en.mjs
              </Typography.Text>
            </>
          }
        />
      )}

      {cat.rebuiltAt && (
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Tek kaynak: <Typography.Text code>catalog-meta.json</Typography.Text>
          {cat.rebuiltAt &&
            ` · birleştirme: ${new Date(cat.rebuiltAt).toLocaleString("tr-TR")}`}
          {cat.inoksanComDescriptions != null &&
            cat.inoksanComDescriptions > 0 &&
            ` · İnoksan.com: ${cat.inoksanComDescriptions}`}
        </Typography.Text>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <ProCard title="Katalog güncelleme" loading={loading} bordered>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              dept/*.json düzenle → birleştir → deploy
            </Typography.Paragraph>
            <Typography.Paragraph copyable={{ text: "node scripts/rebuild-ekipmanlar-from-dept.mjs" }} style={{ marginBottom: 8 }}>
              <Typography.Text code>node scripts/rebuild-ekipmanlar-from-dept.mjs</Typography.Text>
            </Typography.Paragraph>
            <Link href="/yonetim/eticaret?tab=katalog">Katalog tablosu →</Link>
          </ProCard>
        </Col>
        <Col xs={24} md={8}>
          <ProCard title="Meilisearch" loading={loading} bordered>
            <Typography.Text
              style={{ color: stats.searchOk ? "#3f8600" : "#cf1322" }}
            >
              {stats.searchOk ? "Yapılandırıldı" : "Eksik env"}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary">
              İndeks: <code>equsto_products</code>
            </Typography.Text>
          </ProCard>
        </Col>
        <Col xs={24} md={8}>
          <ProCard title="Kur" loading={loading} bordered>
            <Typography.Text>
              {stats.kur != null ? `${stats.kur.toFixed(4)} TRY` : "—"}
            </Typography.Text>
            {stats.kurDate && (
              <>
                <br />
                <Typography.Text type="secondary">
                  TCMB: {stats.kurDate}
                </Typography.Text>
              </>
            )}
          </ProCard>
        </Col>
      </Row>
    </>
  );
}
