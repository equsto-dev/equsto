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
  fetchUrunler,
} from "@/lib/pro-admin-client";

export default function EticaretOzetPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    urunCount: 0,
    urunSource: "—",
    catalog: { ekipmanlar: 0, withImage: 0, brands: 0 },
    catalogRebuiltAt: "",
    inoksanComDescriptions: 0,
    productsEnStale: 0,
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
        const [urun, cat, search, kurRes, fiyat, eticaret] = await Promise.all([
          fetchUrunler(),
          fetchCatalogStats().catch(() => ({
            ekipmanlar: 0,
            withImage: 0,
            brands: 0,
            rebuiltAt: undefined,
            inoksanComDescriptions: 0,
            productsEnStale: 0,
          })),
          fetchSearchCheck(),
          fetchKur(),
          fetchFiyatlarMap(),
          fetchEticaretIcerik(),
        ]);
        if (cancelled) return;
        setStats({
          urunCount: urun.rows.length,
          urunSource: urun.source,
          catalog: cat,
          catalogRebuiltAt: cat.rebuiltAt || "",
          inoksanComDescriptions: cat.inoksanComDescriptions ?? 0,
          productsEnStale: cat.productsEnStale ?? 0,
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

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Vitrin ürünü", value: stats.catalog.ekipmanlar }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Görselli", value: stats.catalog.withImage }}
          />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Admin ürün", value: stats.urunCount }}
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

      {(stats.productsEnStale > 0 ||
        (stats.urunCount > 0 &&
          stats.urunCount !== stats.catalog.ekipmanlar)) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="Katalog uyumsuzluğu"
          description={
            <>
              {stats.productsEnStale > 0 && (
                <>
                  EN çeviri dosyası vitrin kataloğundan{" "}
                  <strong>{stats.productsEnStale}</strong> ürün geride —{" "}
                  <Typography.Text code>
                    node scripts/build-product-i18n-en.mjs
                  </Typography.Text>{" "}
                  çalıştırın.
                  <br />
                </>
              )}
              {stats.urunCount > 0 &&
                stats.urunCount !== stats.catalog.ekipmanlar && (
                  <>
                    Admin ürün API ({stats.urunCount}) ≠ vitrin katalog (
                    {stats.catalog.ekipmanlar}).
                  </>
                )}
            </>
          }
        />
      )}

      {stats.catalogRebuiltAt && (
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
          Katalog birleştirme:{" "}
          {new Date(stats.catalogRebuiltAt).toLocaleString("tr-TR")}
          {stats.inoksanComDescriptions > 0 &&
            ` · İnoksan.com açıklama: ${stats.inoksanComDescriptions}`}
        </Typography.Text>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <ProCard title="Ürün API" loading={loading} bordered>
            <Typography.Text type="secondary">
              Kaynak: {stats.urunSource}
            </Typography.Text>
            <br />
            <Link href="/yonetim/eticaret?tab=urunler">Ürün yönetimine git →</Link>
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
