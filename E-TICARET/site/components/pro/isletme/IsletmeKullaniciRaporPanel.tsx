"use client";

import { ClockCircleOutlined, EyeOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { App, Button, Col, Row, Select, Space, Table, Tag, Typography } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchKullaniciRaporu,
  type KullaniciRaporOzet,
} from "@/lib/pro-admin-client";

export default function IsletmeKullaniciRaporPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<KullaniciRaporOzet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchKullaniciRaporu({ days });
      if (res.error) message.warning(res.error);
      setData(res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [days, message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <ProCard
        title="Kullanıcı raporu"
        subTitle="Hangi ürün sayfasında ne kadar süre kaldılar"
        extra={
          <Space wrap>
            <Select
              value={days}
              onChange={setDays}
              style={{ width: 140 }}
              options={[
                { value: 7, label: "Son 7 gün" },
                { value: 30, label: "Son 30 gün" },
                { value: 90, label: "Son 90 gün" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Yenile
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Vitrin ürün sayfalarında geçen görünür süre kaydedilir (sekme arka plandayken sayılmaz).
          2 saniyeden kısa ziyaretler rapora dahil edilmez.
        </Typography.Paragraph>
      </ProCard>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Sayfa görüntüleme",
              value: data?.views ?? 0,
              icon: <EyeOutlined />,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Benzersiz oturum",
              value: data?.uniqueSessions ?? 0,
              icon: <UserOutlined />,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Farklı ürün",
              value: data?.uniqueProducts ?? 0,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Ort. süre",
              value: data?.avgLabel ?? "—",
              icon: <ClockCircleOutlined />,
            }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ProCard title="En uzun kalan ürünler" loading={loading}>
            <Table
              size="small"
              pagination={{ pageSize: 10 }}
              rowKey="slug"
              dataSource={data?.topByTime || []}
              locale={{ emptyText: "Henüz kayıt yok — ürün sayfalarını ziyaret ettikçe dolar." }}
              columns={[
                {
                  title: "Ürün",
                  dataIndex: "title",
                  ellipsis: true,
                  render: (_, r) => (
                    <Space direction="vertical" size={0}>
                      <Link href={`/shop/${r.dept || "pisirme"}/${r.slug}`} target="_blank">
                        {r.title}
                      </Link>
                      {r.brand ? (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {r.brand}
                          {r.dept ? ` · ${r.dept}` : ""}
                        </Typography.Text>
                      ) : null}
                    </Space>
                  ),
                },
                { title: "Görüntüleme", dataIndex: "views", width: 90 },
                { title: "Toplam süre", dataIndex: "totalLabel", width: 110 },
                { title: "Ort.", dataIndex: "avgLabel", width: 90 },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="En çok bakılan ürünler" loading={loading}>
            <Table
              size="small"
              pagination={{ pageSize: 10 }}
              rowKey="slug"
              dataSource={data?.topByViews || []}
              locale={{ emptyText: "Henüz kayıt yok." }}
              columns={[
                {
                  title: "Ürün",
                  dataIndex: "title",
                  ellipsis: true,
                  render: (_, r) => (
                    <Link href={`/shop/${r.dept || "pisirme"}/${r.slug}`} target="_blank">
                      {r.title}
                    </Link>
                  ),
                },
                { title: "Görüntüleme", dataIndex: "views", width: 90 },
                { title: "Oturum", dataIndex: "uniqueSessions", width: 80 },
                { title: "Ort. süre", dataIndex: "avgLabel", width: 90 },
              ]}
            />
          </ProCard>
        </Col>
        <Col span={24}>
          <ProCard title="Son ziyaretler" loading={loading}>
            <Table
              size="small"
              pagination={{ pageSize: 15 }}
              rowKey="id"
              dataSource={data?.recent || []}
              locale={{ emptyText: "Henüz kayıt yok." }}
              columns={[
                {
                  title: "Zaman",
                  dataIndex: "createdAt",
                  width: 160,
                  render: (v: string) =>
                    v ? new Date(v).toLocaleString("tr-TR") : "—",
                },
                {
                  title: "Ürün",
                  dataIndex: "title",
                  ellipsis: true,
                  render: (_, r) => (
                    <Link href={r.path || `/shop/${r.dept}/${r.slug}`} target="_blank">
                      {r.title}
                    </Link>
                  ),
                },
                {
                  title: "Süre",
                  dataIndex: "durationLabel",
                  width: 100,
                  render: (v: string) => <Tag color="blue">{v}</Tag>,
                },
                {
                  title: "Oturum",
                  dataIndex: "sessionId",
                  width: 100,
                },
                {
                  title: "Üye",
                  dataIndex: "memberId",
                  width: 70,
                  render: (v: string | null) => (v ? <Tag color="green">üye</Tag> : "—"),
                },
              ]}
            />
          </ProCard>
        </Col>
      </Row>
    </Space>
  );
}
