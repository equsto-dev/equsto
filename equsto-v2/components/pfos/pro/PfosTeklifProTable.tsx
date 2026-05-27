"use client";

import type { ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { ConfigProvider, Tag } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import type { PFOSKalemi, PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import { KATEGORI_LABELS } from "@/lib/pfos/schemas/pfos.schema";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import { formatKwHucre } from "@/lib/pfos/teklif/format-v14";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";

function useTablePagination(
  defaultPageSize: number,
  resetKey?: string | number,
): TablePaginationConfig {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => {
    setCurrent(1);
  }, [resetKey]);

  return {
    current,
    pageSize,
    showSizeChanger: true,
    pageSizeOptions: ["10", "25", "50", "100"],
    showTotal: (total, [from, to]) => `${from}-${to} Toplam ${total} Öğe`,
    onChange: (page, size) => {
      setCurrent(page);
      setPageSize(size);
    },
    onShowSizeChange: (_page, size) => {
      setCurrent(1);
      setPageSize(size);
    },
  };
}

type KalemRow = PFOSKalemi & { key: string; grup: string };

function kalemlerToRows(kalemler: PFOSKalemi[]): KalemRow[] {
  return kalemler.map((k) => {
    const grup = k.zoneKey
      ? zoneLabel(k.zoneKey)
      : `${KATEGORI_LABELS[k.kategoriKodu]} (${k.kategoriKodu})`;
    return { ...k, key: `${k.poz}-${k.urunTipi}`, grup };
  });
}

const kalemColumns: ProColumns<KalemRow>[] = [
  { title: "Grup", dataIndex: "grup", width: 160, ellipsis: true },
  { title: "Poz", dataIndex: "poz", width: 56 },
  {
    title: "Ürün",
    dataIndex: "isim",
    ellipsis: true,
    render: (_, r) => (
      <>
        {r.isim}
        {r.tip !== "zorunlu" ? (
          <Tag style={{ marginLeft: 6 }}>{r.tip}</Tag>
        ) : null}
      </>
    ),
  },
  {
    title: "Marka",
    width: 120,
    render: (_, r) => r.urun?.marka ?? "—",
  },
  { title: "Ad", dataIndex: "adet", width: 56, align: "right" },
  {
    title: "Elk. kW",
    width: 72,
    align: "right",
    render: (_, r) =>
      formatKwHucre(r.urun?.elektrikGucuKw ?? r.elektrikGucuKwHint ?? null),
  },
  {
    title: "Gaz kW",
    width: 72,
    align: "right",
    render: (_, r) =>
      formatKwHucre(r.urun?.gazGucuKw ?? r.gazGucuKwHint ?? null),
  },
  {
    title: "Satır TRY",
    width: 110,
    align: "right",
    render: (_, r) =>
      r.urun
        ? (r.urun.fiyat * r.adet).toLocaleString("tr-TR")
        : "—",
  },
];

const v14Columns: ProColumns<TeklifModelV14["satirlar"][number]>[] = [
  { title: "Böl.", dataIndex: "bolumNo", width: 44 },
  { title: "Poz", dataIndex: "poz", width: 52 },
  { title: "EK", dataIndex: "ek", width: 36 },
  { title: "Stok no", dataIndex: "stokNo", width: 88, ellipsis: true },
  { title: "Tanımı", dataIndex: "tanim", ellipsis: true },
  { title: "Marka", dataIndex: "marka", width: 88, ellipsis: true },
  { title: "Ölçü", dataIndex: "olcu", width: 100, ellipsis: true },
  {
    title: "Elk",
    width: 52,
    align: "right",
    render: (_, r) => formatKwHucre(r.elkKw),
  },
  {
    title: "Gaz",
    width: 52,
    align: "right",
    render: (_, r) => formatKwHucre(r.gazKw),
  },
  { title: "Ad", dataIndex: "adet", width: 44, align: "right" },
  {
    title: "Satış",
    width: 96,
    align: "right",
    render: (_, r) =>
      r.birimSatis != null
        ? `${r.birimSatis.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.doviz}`
        : "—",
  },
  {
    title: "Toplam",
    width: 100,
    align: "right",
    render: (_, r) =>
      r.toplamSatis != null
        ? `${r.toplamSatis.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.doviz}`
        : "—",
  },
];

export function PfosKalemProTable({ sonuc }: { sonuc: PFOSResponse }) {
  const pagination = useTablePagination(20, sonuc.kalemler.length);

  return (
    <ConfigProvider getPopupContainer={() => document.body}>
      <ProTable<KalemRow>
        rowKey="key"
        search={false}
        options={false}
        pagination={pagination}
        columns={kalemColumns}
        dataSource={kalemlerToRows(sonuc.kalemler)}
        size="small"
      />
    </ConfigProvider>
  );
}

export function PfosV14ProTable({ model }: { model: TeklifModelV14 }) {
  const pagination = useTablePagination(25, model.satirlar.length);

  return (
    <ConfigProvider getPopupContainer={() => document.body}>
      <ProTable
        rowKey={(r) => `${r.poz}-${r.stokNo}-${r.tanim}`}
        search={false}
        options={false}
        pagination={pagination}
        columns={v14Columns}
        dataSource={model.satirlar}
        size="small"
        scroll={{ x: 1200 }}
      />
    </ConfigProvider>
  );
}
