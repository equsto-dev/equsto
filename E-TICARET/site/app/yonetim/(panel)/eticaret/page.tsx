"use client";

import {
  CloudUploadOutlined,
  DollarOutlined,
  PictureOutlined,
  RobotOutlined,
  SearchOutlined,
  ShopOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { Button, Space, Tabs } from "antd";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import EticaretOzetPanel from "@/components/pro/eticaret/EticaretOzetPanel";

const EticaretFiyatPanel = dynamic(
  () => import("@/components/pro/eticaret/EticaretFiyatPanel"),
  { loading: () => null },
);
const EticaretKampanyaPanel = dynamic(
  () => import("@/components/pro/eticaret/EticaretKampanyaPanel"),
  { loading: () => null },
);
const EticaretAramaPanel = dynamic(
  () => import("@/components/pro/eticaret/EticaretAramaPanel"),
  { loading: () => null },
);
const EticaretYayinPanel = dynamic(
  () => import("@/components/pro/eticaret/EticaretYayinPanel"),
  { loading: () => null },
);
const UrunlerPanel = dynamic(
  () => import("@/components/pro/eticaret/UrunlerPanel"),
  { loading: () => null },
);
const KatalogPanel = dynamic(
  () => import("@/components/pro/eticaret/KatalogPanel"),
  { loading: () => null },
);
const CatalogAgentPanel = dynamic(
  () => import("@/components/pro/eticaret/CatalogAgentPanel"),
  { loading: () => null },
);

const TAB_KEYS = [
  "ozet",
  "urunler",
  "katalog",
  "ajan",
  "fiyat",
  "kampanya",
  "arama",
  "yayin",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(v: string | null): v is TabKey {
  return !!v && (TAB_KEYS as readonly string[]).includes(v);
}

function tabPanel(key: TabKey) {
  switch (key) {
    case "ozet":
      return <EticaretOzetPanel />;
    case "urunler":
      return <UrunlerPanel />;
    case "katalog":
      return <KatalogPanel />;
    case "ajan":
      return <CatalogAgentPanel />;
    case "fiyat":
      return <EticaretFiyatPanel />;
    case "kampanya":
      return <EticaretKampanyaPanel />;
    case "arama":
      return <EticaretAramaPanel />;
    case "yayin":
      return <EticaretYayinPanel />;
    default:
      return null;
  }
}

function EticaretPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : "ozet";

  function onTabChange(key: string) {
    const next = isTabKey(key) ? key : "ozet";
    router.replace(`/yonetim/eticaret?tab=${next}`, { scroll: false });
  }

  return (
    <PageContainer
      title="E-ticaret"
      subTitle="Ürün, katalog, fiyat, kampanya, arama ve yayınlama"
      extra={
        <Space wrap>
          <Button href="/" target="_blank">
            Mağazayı aç
          </Button>
          <Button href="/admin-panel-standalone.html" target="_blank">
            Eski HTML admin
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        destroyInactiveTabPane
        items={[
          {
            key: "ozet",
            label: (
              <>
                <ShopOutlined /> Özet
              </>
            ),
            children: tabPanel("ozet"),
          },
          {
            key: "urunler",
            label: (
              <>
                <ShopOutlined /> Ürünler
              </>
            ),
            children: tabPanel("urunler"),
          },
          {
            key: "katalog",
            label: (
              <>
                <PictureOutlined /> Katalog
              </>
            ),
            children: tabPanel("katalog"),
          },
          {
            key: "ajan",
            label: (
              <>
                <RobotOutlined /> Katalog Ajanı
              </>
            ),
            children: tabPanel("ajan"),
          },
          {
            key: "fiyat",
            label: (
              <>
                <DollarOutlined /> Fiyat
              </>
            ),
            children: tabPanel("fiyat"),
          },
          {
            key: "kampanya",
            label: (
              <>
                <TagOutlined /> Kampanya
              </>
            ),
            children: tabPanel("kampanya"),
          },
          {
            key: "arama",
            label: (
              <>
                <SearchOutlined /> Arama
              </>
            ),
            children: tabPanel("arama"),
          },
          {
            key: "yayin",
            label: (
              <>
                <CloudUploadOutlined /> Yayın
              </>
            ),
            children: tabPanel("yayin"),
          },
        ]}
      />
    </PageContainer>
  );
}

export default function YonetimEticaretPage() {
  return (
    <Suspense fallback={null}>
      <EticaretPageInner />
    </Suspense>
  );
}
