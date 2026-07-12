"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  GoogleOutlined,
  MobileOutlined,
  ReloadOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, ProDescriptions } from "@ant-design/pro-components";
import { Alert, Button, Space, Tabs, Tag, Typography } from "antd";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  fetchCatalogStats,
  fetchKur,
  fetchSearchCheck,
  fetchSearchPreview,
  fetchUrunler,
  getProToken,
  clearProToken,
} from "@/lib/pro-admin-client";

const MobileAgentPanel = dynamic(
  () => import("@/components/pro/kontrol/MobileAgentPanel"),
  { loading: () => null },
);

const GoogleAdsAgentPanel = dynamic(
  () => import("@/components/pro/kontrol/GoogleAdsAgentPanel"),
  { loading: () => null },
);

const TAB_KEYS = ["sistem", "mobil", "google-ads"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(v: string | null): v is TabKey {
  return !!v && (TAB_KEYS as readonly string[]).includes(v);
}

type CheckRow = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

function SistemKontrolPanel() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [allOk, setAllOk] = useState(false);

  const runChecks = useCallback(async () => {
    setLoading(true);
    const rows: CheckRow[] = [];
    const token = getProToken();

    rows.push({
      key: "token",
      label: "Admin token (localStorage)",
      ok: !!token,
      detail: token ? `${token.slice(0, 8)}…` : "Giriş gerekli",
    });

    const urun = await fetchUrunler();
    rows.push({
      key: "api-urunler",
      label: "GET /api/urunler",
      ok: !urun.error,
      detail: urun.error
        ? `${urun.error}${urun.status === 401 ? " — /yonetim/giris ile Vercel EQUSTO_ADMIN_BEARER girin" : ""}`
        : `${urun.rows.length} kayıt · kaynak: ${urun.source || "—"}`,
    });

    try {
      const cat = await fetchCatalogStats();
      rows.push({
        key: "catalog",
        label: "Katalog (catalog-meta.json)",
        ok: cat.ekipmanlar > 0 && cat.source !== "missing",
        detail: `${cat.ekipmanlar} ürün · ${cat.withImage} görselli · ${cat.brands} marka · kaynak: ${cat.source}${
          cat.rebuiltAt
            ? ` · birleştirme: ${new Date(cat.rebuiltAt).toLocaleString("tr-TR")}`
            : ""
        }${
          cat.inoksanComDescriptions
            ? ` · İnoksan.com: ${cat.inoksanComDescriptions}`
            : ""
        }${
          cat.liveDrift
            ? ` · meta↔json fark: ${cat.liveDrift > 0 ? "+" : ""}${cat.liveDrift}`
            : ""
        }`,
      });
      if (cat.productsEnStale && cat.productsEnStale > 0) {
        rows.push({
          key: "products-en",
          label: "EN ürün çevirileri (products-en-by-id.json)",
          ok: false,
          detail: `${cat.productsEnCount ?? "?"} kayıt — vitrin katalogdan ${cat.productsEnStale} ürün geride`,
        });
      }
    } catch (e) {
      rows.push({
        key: "catalog",
        label: "Vitrin katalog (ekipmanlar.json)",
        ok: false,
        detail: e instanceof Error ? e.message : "Yüklenemedi",
      });
    }

    const search = await fetchSearchCheck();
    rows.push({
      key: "search-cfg",
      label: "Meilisearch yapılandırma",
      ok: !!search.configured,
      detail: search.configured
        ? `İndeks: ${search.index || "equsto_products"}`
        : `Eksik: ${JSON.stringify(search.missing || [])}`,
    });

    const preview = await fetchSearchPreview("izgara");
    rows.push({
      key: "search-hit",
      label: "Canlı arama önizleme (?q=izgara)",
      ok: !preview.error && (preview.estimatedTotalHits ?? 0) > 0,
      detail: preview.error
        ? preview.error
        : `${preview.estimatedTotalHits ?? 0} sonuç`,
    });

    const kur = await fetchKur();
    rows.push({
      key: "kur",
      label: "GET /api/kur (TCMB)",
      ok: kur.success !== false && (kur.rate ?? 0) > 0,
      detail:
        kur.rate != null ? `1 EUR = ${Number(kur.rate).toFixed(4)} TRY` : "Kur alınamadı",
    });

    setChecks(rows);
    setAllOk(rows.every((r) => r.ok));
    setLoading(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  return (
    <>
      <Alert
        type={allOk ? "success" : "warning"}
        showIcon
        style={{ marginBottom: 16 }}
        message={allOk ? "Tüm kontroller geçti" : "Bazı kontroller başarısız"}
        description="Katalog, PFOS ve yayınlama modüllerine ana sayfadaki kartlardan veya sol menüden ulaşın."
      />

      <ProCard
        title="Kontrol listesi"
        loading={loading}
        extra={
          <Button icon={<ReloadOutlined />} onClick={runChecks} loading={loading}>
            Yeniden kontrol et
          </Button>
        }
      >
        <ProDescriptions
          column={1}
          dataSource={Object.fromEntries(checks.map((c) => [c.key, c.detail]))}
          columns={checks.map((c) => ({
            title: (
              <Space>
                {c.ok ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                )}
                {c.label}
                <Tag color={c.ok ? "success" : "error"}>{c.ok ? "OK" : "HATA"}</Tag>
              </Space>
            ),
            dataIndex: c.key,
          }))}
        />
      </ProCard>

      <ProCard title="Hızlı bağlantılar" style={{ marginTop: 16 }}>
        <Typography.Paragraph>
          Modül panelleri: <Link href="/yonetim">Ana sayfa</Link>,{" "}
          <Link href="/yonetim/eticaret">E-ticaret</Link>,{" "}
          <Link href="/yonetim/pfos">PFOS</Link>.
        </Typography.Paragraph>
        <Space wrap>
          {checks.some((c) => c.key === "api-urunler" && !c.ok) && (
            <Button
              danger
              onClick={() => {
                clearProToken();
                window.location.href = "/yonetim/giris";
              }}
            >
              Yanlış token — yeniden giriş
            </Button>
          )}
          <Button type="primary" href="/yonetim/eticaret?tab=urunler">
            Ürünlere git
          </Button>
          <Button href="/yonetim/eticaret?tab=arama">Arama</Button>
          <Button href="/yonetim/kontrol?tab=mobil">Mobil Ajan</Button>
          <Button href="/yonetim/kontrol?tab=google-ads">Google Ads Ajan</Button>
          <Button href="/" target="_blank">
            Mağazayı aç
          </Button>
        </Space>
      </ProCard>
    </>
  );
}

function KontrolPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : "sistem";

  function onTabChange(key: string) {
    const next = isTabKey(key) ? key : "sistem";
    router.replace(`/yonetim/kontrol?tab=${next}`, { scroll: false });
  }

  return (
    <PageContainer
      title="Sistem kontrolü"
      subTitle="API, katalog, arama, mobil ve Google Ads denetimi"
      extra={
        <Button href="/" target="_blank">
          Mağazayı aç
        </Button>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        destroyInactiveTabPane
        items={[
          {
            key: "sistem",
            label: (
              <>
                <ToolOutlined /> Sistem
              </>
            ),
            children: <SistemKontrolPanel />,
          },
          {
            key: "mobil",
            label: (
              <>
                <MobileOutlined /> Mobil Ajan
              </>
            ),
            children: <MobileAgentPanel />,
          },
          {
            key: "google-ads",
            label: (
              <>
                <GoogleOutlined /> Google Ads Ajan
              </>
            ),
            children: <GoogleAdsAgentPanel />,
          },
        ]}
      />
    </PageContainer>
  );
}

export default function YonetimKontrolPage() {
  return (
    <Suspense fallback={null}>
      <KontrolPageInner />
    </Suspense>
  );
}
