"use client";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  ProjectOutlined,
  RightOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, StatisticCard } from "@ant-design/pro-components";
import { Alert, Button, Col, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  fetchCatalogStats,
  fetchProjeAkis,
} from "@/lib/pro-admin-client";

type ModuleCard = {
  key: string;
  pill: string;
  pillColor: string;
  title: string;
  desc: string;
  href: string;
  icon: ReactNode;
  ready?: boolean;
};

const MODULES: ModuleCard[] = [
  {
    key: "pfos",
    pill: "PFOS",
    pillColor: "blue",
    title: "Proje Fabrikası",
    desc: "Soru seti, konsept, m² bantları, set & kural, teklif çıktısı.",
    href: "/yonetim/pfos",
    icon: <ProjectOutlined />,
    ready: true,
  },
  {
    key: "isletme",
    pill: "İşletme",
    pillColor: "purple",
    title: "Sipariş & CRM",
    desc: "Sipariş, teklif, müşteri, rapor, ayarlar ve kupon raporu.",
    href: "/yonetim/isletme",
    icon: <ShopOutlined />,
    ready: true,
  },
  {
    key: "eticaret",
    pill: "E-ticaret",
    pillColor: "green",
    title: "Mağaza yönetimi",
    desc: "Ürün, katalog, fiyat, kampanya, arama ve yayınlama — tek panel.",
    href: "/yonetim/eticaret",
    icon: <ShopOutlined />,
    ready: true,
  },
  {
    key: "urun",
    pill: "Ürün",
    pillColor: "cyan",
    title: "Ürün CRUD",
    desc: "Filtreleme, toplu yükleme, eksik bilgi kontrolü, PFOS aktiflik.",
    href: "/yonetim/eticaret?tab=urunler",
    icon: <AppstoreOutlined />,
    ready: true,
  },
  {
    key: "katalog",
    pill: "Görsel",
    pillColor: "cyan",
    title: "Katalog & Görseller",
    desc: "Vitrin ekipman listesi, görsel önizleme, marka sayısı.",
    href: "/yonetim/eticaret?tab=katalog",
    icon: <AppstoreOutlined />,
    ready: true,
  },
  {
    key: "fiyat",
    pill: "Fiyat",
    pillColor: "gold",
    title: "Fiyat kontrolü",
    desc: "Kur, eksik fiyat listesi, tip_kodu eşleşmesi ve düzenleme.",
    href: "/yonetim/eticaret?tab=fiyat",
    icon: <ShopOutlined />,
    ready: true,
  },
  {
    key: "arama",
    pill: "Arama",
    pillColor: "blue",
    title: "Arama & Filtre",
    desc: "Meilisearch indeks kontrolü ve canlı arama önizlemesi.",
    href: "/yonetim/eticaret?tab=arama",
    icon: <SearchOutlined />,
    ready: true,
  },
  {
    key: "yayin",
    pill: "Yayın",
    pillColor: "green",
    title: "Yayınlama kontrolü",
    desc: "Sitemap, feed, katalog dosyaları ve deploy adımları.",
    href: "/yonetim/eticaret?tab=yayin",
    icon: <CloudUploadOutlined />,
    ready: true,
  },
];

type RoadmapStep = {
  id: string;
  label: string;
  href: string;
  status: "done" | "current" | "pending";
};

const ROADMAP: RoadmapStep[] = [
  {
    id: "panel",
    label: "Panel yerelde aktif — giriş, PFOS, e-ticaret modülü, kontrol.",
    href: "/yonetim/kontrol",
    status: "done",
  },
  {
    id: "eticaret",
    label: "E-ticaret — fiyat sağlığı, kampanya/kupon, yayın dosya kontrolü.",
    href: "/yonetim/eticaret",
    status: "done",
  },
  {
    id: "pfos-sk",
    label: "PFOS Set & Kural editörü — konseptlerden taslak üret, proje-akis.json kaydet.",
    href: "/yonetim/pfos",
    status: "done",
  },
  {
    id: "urun",
    label: "Ürün yönetimi — hızlı filtreler, eksik bilgi uyarıları, toplu yükleme.",
    href: "/yonetim/eticaret?tab=urunler",
    status: "done",
  },
  {
    id: "kampanya",
    label: "Kampanya — vitrin banner ve kupon entegrasyonu mağazada.",
    href: "/yonetim/eticaret?tab=kampanya",
    status: "done",
  },
  {
    id: "yayin",
    label: "Yayınlama — indeks, sitemap ve Google feed tek listede.",
    href: "/yonetim/eticaret?tab=yayin",
    status: "done",
  },
];

export default function YonetimHub() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    questions: 0,
    concepts: 0,
    rules: 0,
    sets: 0,
    products: 0,
    catalog: 0,
    catalogBrands: 0,
  });

  useEffect(() => {
    Promise.all([
      fetchProjeAkis(),
      fetchCatalogStats().catch(() => ({
        ekipmanlar: 0,
        withImage: 0,
        brands: 0,
        source: "missing" as const,
      })),
    ])
      .then(([akis, cat]) => {
        setStats({
          questions: akis.data?.questions?.length ?? 0,
          concepts: akis.data?.shopTypes?.length ?? 0,
          rules: akis.data?.rules?.length ?? 0,
          sets: akis.data?.eqSets?.length ?? 0,
          products: akis.data?.products?.length ?? 0,
          catalog: cat.ekipmanlar,
          catalogBrands: cat.brands,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer
      title="Equsto Yönetim"
      subTitle="PFOS, e-ticaret ve sistem kontrolü — tek merkez"
      extra={
        <Space wrap>
          <Button href="/yonetim/kontrol">Sistem kontrolü</Button>
          <Button type="primary" href="/pfos" target="_blank">
            Canlı PFOS
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Sorular", value: stats.questions }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Konsept", value: stats.concepts }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Setler", value: stats.sets }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Kurallar", value: stats.rules }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Katalog ürünü", value: stats.catalog }} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <StatisticCard loading={loading} statistic={{ title: "Marka", value: stats.catalogBrands }} />
        </Col>
      </Row>

      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Modüller
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {MODULES.map((m) => (
          <Col xs={24} sm={12} lg={8} key={m.key}>
            <ProCard
              hoverable
              bordered
              style={{ height: "100%" }}
              onClick={() => {
                window.location.href = m.href;
              }}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space>
                  <Tag color={m.pillColor}>{m.pill}</Tag>
                  {!m.ready && <Tag>Yakında</Tag>}
                </Space>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {m.icon} {m.title}
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {m.desc}
                </Typography.Paragraph>
                <Link href={m.href}>Panele git →</Link>
              </Space>
            </ProCard>
          </Col>
        ))}
      </Row>

      <ProCard title="PFOS hedefi" style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col xs={24} md={10}>
            <Alert
              type="info"
              showIcon
              message="Mevcut durum"
              description="Konseptler ve soru seti hazır. Set & Kural sekmesinden taslak üretip proje-akis.json'a kaydedebilirsiniz."
            />
          </Col>
          <Col xs={24} md={14}>
            <Typography.Text type="secondary">Akış</Typography.Text>
            <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>Soru seti — müşteriye ne sorulacak?</li>
              <li>Konsept — steakhouse, balıkçı, coffee shop…</li>
              <li>Setler — konsept + m² bandı ekipman paketi</li>
              <li>Kurallar — cevaplar geldiyse hangi set?</li>
            </ol>
            <Button type="primary" href="/yonetim/pfos" style={{ marginTop: 12 }}>
              PFOS paneline git
            </Button>
          </Col>
        </Row>
      </ProCard>

      <ProCard title="Geliştirme sırası" style={{ marginTop: 16 }}>
        {ROADMAP.map((step, i) => (
          <div
            key={step.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              gap: 12,
              alignItems: "start",
              padding: "10px 0",
              borderBottom: i < ROADMAP.length - 1 ? "1px solid #f0f0f0" : undefined,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  step.status === "done"
                    ? "#52c41a"
                    : step.status === "current"
                      ? "#1463ff"
                      : "#d9d9d9",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {step.status === "done" ? (
                <CheckCircleOutlined style={{ fontSize: 14 }} />
              ) : (
                i + 1
              )}
            </span>
            <div>
              <Typography.Text
                style={{
                  color: step.status === "pending" ? "rgba(0,0,0,.45)" : undefined,
                }}
              >
                {step.label}
              </Typography.Text>
              {step.status === "done" && (
                <Tag color="success" style={{ marginLeft: 8 }}>
                  Tamam
                </Tag>
              )}
            </div>
            <Link href={step.href}>
              <RightOutlined /> Panele git
            </Link>
          </div>
        ))}
      </ProCard>
    </PageContainer>
  );
}
