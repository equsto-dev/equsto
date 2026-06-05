"use client";

import {
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TagOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { Tabs } from "antd";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const IsletmeSiparislerPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmeSiparislerPanel"),
  { loading: () => null },
);
const IsletmeTekliflerPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmeTekliflerPanel"),
  { loading: () => null },
);
const IsletmeMusterilerPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmeMusterilerPanel"),
  { loading: () => null },
);
const IsletmeRaporlarPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmeRaporlarPanel"),
  { loading: () => null },
);
const IsletmeAyarlarPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmeAyarlarPanel"),
  { loading: () => null },
);
const IsletmePazarlamaPanel = dynamic(
  () => import("@/components/pro/isletme/IsletmePazarlamaPanel"),
  { loading: () => null },
);

const TAB_KEYS = [
  "siparisler",
  "teklifler",
  "musteriler",
  "raporlar",
  "ayarlar",
  "pazarlama",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(v: string | null): v is TabKey {
  return !!v && (TAB_KEYS as readonly string[]).includes(v);
}

function tabPanel(key: TabKey) {
  switch (key) {
    case "siparisler":
      return <IsletmeSiparislerPanel />;
    case "teklifler":
      return <IsletmeTekliflerPanel />;
    case "musteriler":
      return <IsletmeMusterilerPanel />;
    case "raporlar":
      return <IsletmeRaporlarPanel />;
    case "ayarlar":
      return <IsletmeAyarlarPanel />;
    case "pazarlama":
      return <IsletmePazarlamaPanel />;
    default:
      return null;
  }
}

function IsletmePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : "siparisler";

  function onTabChange(key: string) {
    const next = isTabKey(key) ? key : "siparisler";
    router.replace(`/yonetim/isletme?tab=${next}`, { scroll: false });
  }

  return (
    <PageContainer
      title="İşletme"
      subTitle="Sipariş, teklif, müşteri, rapor, ayarlar ve pazarlama"
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        destroyInactiveTabPane
        items={[
          {
            key: "siparisler",
            label: (
              <>
                <ShoppingOutlined /> Siparişler
              </>
            ),
            children: tabPanel("siparisler"),
          },
          {
            key: "teklifler",
            label: (
              <>
                <FileTextOutlined /> Teklifler
              </>
            ),
            children: tabPanel("teklifler"),
          },
          {
            key: "musteriler",
            label: (
              <>
                <TeamOutlined /> Müşteriler
              </>
            ),
            children: tabPanel("musteriler"),
          },
          {
            key: "raporlar",
            label: (
              <>
                <BarChartOutlined /> Raporlar
              </>
            ),
            children: tabPanel("raporlar"),
          },
          {
            key: "ayarlar",
            label: (
              <>
                <SettingOutlined /> Ayarlar
              </>
            ),
            children: tabPanel("ayarlar"),
          },
          {
            key: "pazarlama",
            label: (
              <>
                <TagOutlined /> Pazarlama
              </>
            ),
            children: tabPanel("pazarlama"),
          },
        ]}
      />
    </PageContainer>
  );
}

export default function YonetimIsletmePage() {
  return (
    <Suspense fallback={null}>
      <IsletmePageInner />
    </Suspense>
  );
}
