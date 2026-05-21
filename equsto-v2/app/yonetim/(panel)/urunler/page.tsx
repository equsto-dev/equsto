"use client";

import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Tag } from "antd";
import { useMemo } from "react";
import type { AdminUrunApiRow } from "@/lib/pro-admin-client";
import { fetchUrunler } from "@/lib/pro-admin-client";

export default function YonetimUrunlerPage() {
  const columns: ProColumns<AdminUrunApiRow>[] = useMemo(
    () => [
      {
        title: "Ürün",
        dataIndex: "ad",
        ellipsis: true,
        width: 280,
      },
      {
        title: "Marka",
        dataIndex: "marka_ad",
        width: 160,
        ellipsis: true,
      },
      {
        title: "Kategori",
        dataIndex: "kategori",
        width: 140,
        ellipsis: true,
      },
      {
        title: "Fiyat (TL)",
        dataIndex: "fiyat_tl",
        width: 110,
        valueType: "money",
        locale: "tr-TR",
        search: false,
      },
      {
        title: "Durum",
        dataIndex: "durum",
        width: 90,
        valueType: "select",
        valueEnum: {
          aktif: { text: "Aktif", status: "Success" },
          pasif: { text: "Pasif", status: "Default" },
        },
        render: (_, row) => (
          <Tag color={row.durum === "aktif" ? "green" : "default"}>{row.durum}</Tag>
        ),
      },
      {
        title: "Kaynak ID",
        dataIndex: "id",
        copyable: true,
        ellipsis: true,
        search: false,
      },
    ],
    [],
  );

  return (
    <PageContainer title="Ürünler" subTitle="GET /api/urunler — DB veya legacy katalog">
      <ProTable<AdminUrunApiRow>
        rowKey="id"
        columns={columns}
        request={async () => {
          const { rows, source, error } = await fetchUrunler();
          if (error) {
            return { data: [], success: false, total: 0 };
          }
          return {
            data: rows,
            success: true,
            total: rows.length,
          };
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: "auto" }}
        headerTitle="Ürün listesi"
        toolBarRender={() => [
          <Tag key="src" color="blue">
            API
          </Tag>,
        ]}
        scroll={{ x: 900 }}
      />
    </PageContainer>
  );
}
