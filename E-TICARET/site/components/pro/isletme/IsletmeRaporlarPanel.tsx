"use client";

import { ProCard, StatisticCard } from "@ant-design/pro-components";
import { App, Col, Row, Table, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { fetchRaporlar, type RaporOzet } from "@/lib/pro-admin-client";

export default function IsletmeRaporlarPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RaporOzet | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRaporlar();
      if (res.error) message.warning(res.error);
      setData(res.data as RaporOzet | null);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.siparis;
  const t = data?.teklif;

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <StatisticCard loading={loading} statistic={{ title: "Sipariş", value: s?.toplam ?? 0 }} />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Ciro (iptal hariç)",
              value: s ? `${s.ciro_tl.toLocaleString("tr-TR")} ₺` : "—",
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard loading={loading} statistic={{ title: "Teklif", value: t?.toplam ?? 0 }} />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Onaylı teklif", value: t?.onaylandi ?? 0 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ProCard title="Sepette birlikte (marka · ürün)" loading={loading}>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => `${r.a}-${r.b}`}
              dataSource={data?.birlikte_sepet || []}
              columns={[
                { title: "Ürün A", dataIndex: "a", ellipsis: true },
                { title: "Ürün B", dataIndex: "b", ellipsis: true },
                { title: "Sepet", dataIndex: "count", width: 70 },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="Marka / kategori özeti" loading={loading}>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => `${r.marka}-${r.kategori}`}
              dataSource={data?.marka_kategori || []}
              columns={[
                { title: "Marka", dataIndex: "marka" },
                { title: "Kategori", dataIndex: "kategori", ellipsis: true },
                { title: "Adet", dataIndex: "adet", width: 60 },
                {
                  title: "Tutar",
                  dataIndex: "tutar",
                  render: (v) => `${Number(v).toLocaleString("tr-TR")} ₺`,
                },
              ]}
            />
          </ProCard>
        </Col>
        <Col span={24}>
          <ProCard title="Arama sorguları (son 30 gün)" loading={loading} extra={<a onClick={load}>Yenile</a>}>
            {!data?.arama?.length ? (
              <Typography.Text type="secondary">
                Henüz kayıt yok — vitrin araması yapıldıkça dolar.
              </Typography.Text>
            ) : (
              <Table
                size="small"
                pagination={{ pageSize: 15 }}
                rowKey="query"
                dataSource={data.arama}
                columns={[
                  { title: "Sorgu", dataIndex: "query" },
                  { title: "Adet", dataIndex: "count", width: 80 },
                  { title: "Ort. sonuç", dataIndex: "avg_hits", width: 100 },
                ]}
              />
            )}
          </ProCard>
        </Col>
      </Row>
    </>
  );
}
