"use client";

import { ProCard, ProDescriptions } from "@ant-design/pro-components";
import { Alert, Button, Input, Space, Table, Typography } from "antd";
import { useEffect, useState } from "react";
import { fetchSearchCheck, fetchSearchPreview } from "@/lib/pro-admin-client";

export default function EticaretAramaPanel() {
  const [check, setCheck] = useState<Record<string, unknown>>({});
  const [q, setQ] = useState("izgara");
  const [preview, setPreview] = useState<
    { name?: string; brand?: string; dept?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSearchCheck().then(setCheck);
  }, []);

  async function onPreview() {
    setLoading(true);
    try {
      const res = await fetchSearchPreview(q);
      setPreview(
        (res.hits as { name?: string; brand?: string; dept?: string }[]) || [],
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ProCard title="Yapılandırma" style={{ marginBottom: 16 }}>
        <ProDescriptions
          column={1}
          dataSource={check}
          columns={[
            { title: "Hazır", dataIndex: "configured", valueType: "switch" },
            { title: "İndeks", dataIndex: "index" },
            {
              title: "Eksik env",
              dataIndex: "missing",
              render: (v) => JSON.stringify(v),
            },
          ]}
        />
      </ProCard>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="İndeksi yenilemek"
        description={
          <>
            Yerelde: <Typography.Text code>npm run search:index</Typography.Text>{" "}
            — kaynak{" "}
            <Typography.Text code>public/data/ekipmanlar.json</Typography.Text>
          </>
        }
      />

      <ProCard title="Canlı önizleme">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Arama terimi"
            style={{ width: 240 }}
            onPressEnter={onPreview}
          />
          <Button type="primary" onClick={onPreview} loading={loading}>
            Ara
          </Button>
          <Button href={`/arama?q=${encodeURIComponent(q)}`} target="_blank">
            Mağaza sayfası
          </Button>
        </Space>
        <Table
          size="small"
          loading={loading}
          rowKey={(r, i) => `${r.name}-${i}`}
          dataSource={preview}
          pagination={false}
          columns={[
            { title: "Ürün", dataIndex: "name", ellipsis: true },
            { title: "Marka", dataIndex: "brand", width: 180 },
            { title: "Dept", dataIndex: "dept", width: 120 },
          ]}
        />
      </ProCard>
    </>
  );
}
