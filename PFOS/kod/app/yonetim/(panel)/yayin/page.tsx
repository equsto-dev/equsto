"use client";

import { PageContainer, ProCard, StepsForm } from "@ant-design/pro-components";
import { Alert, Typography } from "antd";

export default function YonetimYayinPage() {
  return (
    <PageContainer
      title="Yayınlama"
      subTitle="Katalog ve arama indeksini canlıya alma"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Sırayla ürün ekliyorsunuz"
        description="12.500 arşiv kullanılmıyor. Vitrin = dept birleşimi → ekipmanlar.json → Meilisearch."
      />

      <ProCard>
        <StepsForm
          submitter={false}
          stepsProps={{ direction: "vertical" }}
        >
          <StepsForm.StepForm
            name="dept"
            title="1. Dept / ürün JSON"
            onFinish={async () => true}
          >
            <Typography.Paragraph>
              Yeni ürünleri <Typography.Text code>public/data/dept/*.json</Typography.Text>{" "}
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
            <Typography.Paragraph copyable>
              npm run search:index
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Beklenen: kaynak ekipmanlar.json, ~2317 belge (siz ekledikçe artar).
            </Typography.Text>
          </StepsForm.StepForm>
          <StepsForm.StepForm
            name="deploy"
            title="4. Deploy"
            onFinish={async () => true}
          >
            <Typography.Paragraph>
              <Typography.Text code>git push origin main</Typography.Text> → Vercel
              yeşil check → Production.
            </Typography.Paragraph>
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </PageContainer>
  );
}
