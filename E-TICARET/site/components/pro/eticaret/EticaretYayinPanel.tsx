"use client";

import { ProCard, StepsForm } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import type { PublishCheckItem } from "@/lib/pro-admin-client";
import { fetchPublishChecks } from "@/lib/pro-admin-client";

export default function EticaretYayinPanel() {
  const [checks, setChecks] = useState<PublishCheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setChecks(await fetchPublishChecks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const okCount = checks.filter((c) => c.ok).length;

  return (
    <>
      <Alert
        type={okCount === checks.length ? "success" : "warning"}
        showIcon
        style={{ marginBottom: 16 }}
        message={`Yayın kontrolü: ${okCount}/${checks.length} hazır`}
        description="Katalog, fiyat, sitemap, Google feed ve AI keşif dosyalarının erişilebilirliği."
        action={
          <Button size="small" onClick={load} loading={loading}>
            Yenile
          </Button>
        }
      />

      <ProCard title="Canlı dosya durumu" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          loading={loading}
          rowKey="id"
          pagination={false}
          dataSource={checks}
          columns={[
            { title: "Kaynak", dataIndex: "label", width: 200 },
            {
              title: "Durum",
              dataIndex: "ok",
              width: 100,
              render: (_, r) =>
                r.ok ? <Tag color="green">OK</Tag> : <Tag color="red">Hata</Tag>,
            },
            { title: "Detay", dataIndex: "detail", ellipsis: true },
            {
              title: "",
              width: 80,
              render: (_, r) => (
                <a href={r.url} target="_blank" rel="noreferrer">
                  Aç
                </a>
              ),
            },
          ]}
        />
      </ProCard>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Sırayla ürün ekliyorsunuz"
        description="Vitrin = dept birleşimi → ekipmanlar.json → Meilisearch → deploy."
      />

      <ProCard>
        <StepsForm submitter={false} stepsProps={{ direction: "vertical" }}>
          <StepsForm.StepForm
            name="dept"
            title="1. Dept / ürün JSON"
            onFinish={async () => true}
          >
            <Typography.Paragraph>
              Yeni ürünleri{" "}
              <Typography.Text code>public/data/dept/*.json</Typography.Text>{" "}
              içine ekleyin. Her satırda <strong>images[]</strong> dolu olsun.
            </Typography.Paragraph>
          </StepsForm.StepForm>
          <StepsForm.StepForm
            name="merge"
            title="2. ekipmanlar.json birleştir"
            onFinish={async () => true}
          >
            <Typography.Paragraph copyable>
              node scripts/rebuild-ekipmanlar-from-dept.mjs
            </Typography.Paragraph>
          </StepsForm.StepForm>
          <StepsForm.StepForm
            name="search"
            title="3. Arama indeksi"
            onFinish={async () => true}
          >
            <Space direction="vertical">
              <Typography.Paragraph copyable>
                npm run search:index
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                Kaynak: ekipmanlar.json — ürün sayısı katalog ile eşleşmeli.
              </Typography.Text>
            </Space>
          </StepsForm.StepForm>
          <StepsForm.StepForm
            name="deploy"
            title="4. Deploy"
            onFinish={async () => true}
          >
            <Typography.Paragraph>
              <Typography.Text code>git push origin main</Typography.Text> →
              Vercel production. Sitemap ve feed otomatik servis edilir.
            </Typography.Paragraph>
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </>
  );
}
