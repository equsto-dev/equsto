"use client";

import { PictureOutlined, WarningOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { Alert, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type EkipmanRow,
  ekipmanPreviewSrc,
  fetchEkipmanlarCatalog,
  rowHasImage,
} from "@/lib/pro-admin-client";

type TableRow = EkipmanRow & { key: string; hasImage: boolean };

export default function YonetimKatalogPage() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "noImage" | "hasImage">("all");
  const [brandFilter, setBrandFilter] = useState<"all" | "ozti">("ozti");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEkipmanlarCatalog();
      setRows(
        data.map((r, i) => ({
          ...r,
          key: r.id || `row-${i}`,
          hasImage: rowHasImage(r),
        })),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const withImage = rows.filter((r) => r.hasImage).length;
    return {
      total: rows.length,
      withImage,
      without: rows.length - withImage,
    };
  }, [rows]);

  const brandRows = useMemo(() => {
    if (brandFilter === "ozti") {
      return rows.filter((r) => /öztiryaki|oztiryaki/i.test(r.brand || ""));
    }
    return rows;
  }, [rows, brandFilter]);

  const filtered = useMemo(() => {
    let list = brandRows;
    if (filter === "noImage") list = list.filter((r) => !r.hasImage);
    else if (filter === "hasImage") list = list.filter((r) => r.hasImage);
    return list;
  }, [brandRows, filter]);

  const oztiStats = useMemo(() => {
    const oz = rows.filter((r) => /öztiryaki|oztiryaki/i.test(r.brand || ""));
    const withImage = oz.filter((r) => r.hasImage).length;
    const withKw = oz.filter((r) => (r.keywords?.length || 0) > 0).length;
    const withAcik = oz.filter((r) => (r.aciklama || "").trim().length > 20).length;
    return { total: oz.length, withImage, withKw, withAcik };
  }, [rows]);

  const columns: ProColumns<TableRow>[] = [
    {
      title: "Görsel",
      dataIndex: "hasImage",
      width: 72,
      render: (_, r) => {
        if (!r.hasImage) {
          return (
            <Tag color="warning" icon={<WarningOutlined />}>
              Yok
            </Tag>
          );
        }
        const src = ekipmanPreviewSrc(r);
        if (!src) {
          return (
            <Tag color="success" icon={<PictureOutlined />}>
              Var
            </Tag>
          );
        }
        return (
          <img
            src={src}
            alt=""
            width={48}
            height={48}
            style={{ objectFit: "contain", background: "#f5f5f5", borderRadius: 4 }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        );
      },
    },
    {
      title: "Ürün",
      dataIndex: "name",
      ellipsis: true,
      copyable: true,
    },
    { title: "Kod", dataIndex: "urun_kodu", width: 130, copyable: true, ellipsis: true },
    { title: "Marka", dataIndex: "brand", width: 140, ellipsis: true },
    { title: "Dept", dataIndex: "dept", width: 110 },
    {
      title: "KW",
      dataIndex: "keywords",
      width: 56,
      render: (_, r) => (r.keywords?.length ? r.keywords.length : "—"),
    },
    {
      title: "Açıklama",
      dataIndex: "aciklama",
      ellipsis: true,
      width: 180,
      render: (_, r) =>
        (r.aciklama || r.specs || "").split("\n")[0].slice(0, 80) || "—",
    },
    {
      title: "images[0]",
      dataIndex: "images",
      ellipsis: true,
      search: false,
      render: (_, r) =>
        r.hasImage ? (
          <Typography.Text code style={{ fontSize: 11 }}>
            {String(r.images?.[0] || "")}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">— doldurun</Typography.Text>
        ),
    },
  ];

  return (
    <PageContainer
      title="Katalog & görseller"
      subTitle="Sırayla eklediğiniz ürünler — vitrin + arama indeksi kaynağı"
      extra={
        <Space>
          <Tag color="blue">{stats.total} ürün</Tag>
          <Tag color="success">{stats.withImage} görselli</Tag>
          <Tag color="warning">{stats.without} görselsiz</Tag>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`Öztiryakiler: ${oztiStats.total} ürün · ${oztiStats.withImage} görselli · ${oztiStats.withAcik} açıklamalı · ${oztiStats.withKw} anahtar kelime`}
        description={
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            CDN yedek (hızlı):{" "}
            <Typography.Text code>npm run catalog:ozti:patch-web</Typography.Text>{" "}
            → <Typography.Text code>catalog:ozti:ekipmanlar</Typography.Text>. Kaliteli
            PDF görseller:{" "}
            <Typography.Text code>npm run catalog:ozti:full</Typography.Text>
          </Typography.Paragraph>
        }
      />

      <ProTable<TableRow>
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        search={{ labelWidth: "auto" }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        headerTitle="Vitrin kataloğu (ekipmanlar.json)"
        toolbar={{
          menu: {
            type: "tab",
            activeKey: filter,
            items: [
              { key: "noImage", label: `Görselsiz` },
              { key: "hasImage", label: `Görselli` },
              { key: "all", label: `Tümü` },
            ],
            onChange: (key) => setFilter((key as typeof filter) || "all"),
          },
          actions: [
            <Tag
              key="brand"
              color={brandFilter === "ozti" ? "processing" : "default"}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setBrandFilter(brandFilter === "ozti" ? "all" : "ozti")
              }
            >
              {brandFilter === "ozti" ? "Öztiryakiler" : "Tüm markalar"}
            </Tag>,
          ],
        }}
        toolBarRender={() => [
          <a key="reload" onClick={load}>
            Yenile
          </a>,
        ]}
        scroll={{ x: 960 }}
      />
    </PageContainer>
  );
}
