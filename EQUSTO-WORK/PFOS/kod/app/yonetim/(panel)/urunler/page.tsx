"use client";

import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { App, Button, Popconfirm, Select, Space, Tag } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminUrunApiRow, UrunMetaBrand, UrunMetaCategory } from "@/lib/pro-admin-client";
import {
  deleteUrun,
  fetchUrunler,
  fetchUrunlerMeta,
  saveUrun,
} from "@/lib/pro-admin-client";

type FormValues = {
  ad: string;
  sku?: string;
  marka_id: string;
  kategori: string;
  fiyat_tl: number;
  el_guc?: number;
  gaz_guc?: number;
  stok?: number;
  durum: "aktif" | "pasif";
  aciklama?: string;
};

export default function YonetimUrunlerPage() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [brands, setBrands] = useState<UrunMetaBrand[]>([]);
  const [categories, setCategories] = useState<UrunMetaCategory[]>([]);
  const [source, setSource] = useState<string>("");
  const [filterMarka, setFilterMarka] = useState<string | undefined>();
  const [filterKategori, setFilterKategori] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUrunApiRow | null>(null);

  const loadMeta = useCallback(async () => {
    const meta = await fetchUrunlerMeta();
    if (meta.error) {
      message.warning(meta.error);
      return;
    }
    setBrands(meta.brands);
    setCategories(meta.categories);
  }, [message]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ label: b.name, value: b.slug })),
    [brands],
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.slug })),
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: AdminUrunApiRow) => {
    if (row.readonly || row.id.startsWith("ecom_")) {
      message.info("Legacy katalog satırı — yalnızca DB ürünleri düzenlenebilir.");
      return;
    }
    setEditing(row);
    setModalOpen(true);
  };

  const columns: ProColumns<AdminUrunApiRow>[] = useMemo(
    () => [
      {
        title: "SKU",
        dataIndex: "sku",
        width: 130,
        copyable: true,
        ellipsis: true,
        search: true,
      },
      {
        title: "Ad",
        dataIndex: "ad",
        ellipsis: true,
        width: 260,
      },
      {
        title: "Kategori",
        dataIndex: "kategori_ad",
        width: 140,
        ellipsis: true,
        render: (_, row) => row.kategori_ad || row.kategori,
      },
      {
        title: "Marka",
        dataIndex: "marka_ad",
        width: 140,
        ellipsis: true,
      },
      {
        title: "Fiyat (TL)",
        dataIndex: "fiyat_tl",
        width: 120,
        search: false,
        render: (_, row) =>
          row.fiyat_tl > 0
            ? row.fiyat_tl.toLocaleString("tr-TR", { maximumFractionDigits: 0 })
            : "—",
      },
      {
        title: "El. kW",
        dataIndex: "el_guc",
        width: 80,
        search: false,
        render: (_, row) =>
          row.el_guc != null && Number.isFinite(row.el_guc) ? row.el_guc : "—",
      },
      {
        title: "Gaz kW",
        dataIndex: "gaz_guc",
        width: 80,
        search: false,
        render: (_, row) =>
          row.gaz_guc != null && Number.isFinite(row.gaz_guc) ? row.gaz_guc : "—",
      },
      {
        title: "Durum",
        dataIndex: "durum",
        width: 88,
        search: false,
        render: (_, row) => (
          <Tag color={row.durum === "aktif" ? "green" : "default"}>{row.durum}</Tag>
        ),
      },
      {
        title: "İşlem",
        valueType: "option",
        width: 140,
        fixed: "right",
        render: (_, row) => [
          <a key="edit" onClick={() => openEdit(row)}>
            Düzenle
          </a>,
          !row.readonly && !row.id.startsWith("ecom_") ? (
            <Popconfirm
              key="del"
              title="Ürün silinsin mi?"
              onConfirm={async () => {
                const r = await deleteUrun(row.id);
                if (!r.ok) {
                  message.error(r.error || "Silinemedi");
                  return;
                }
                message.success("Silindi");
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: "#cf1322" }}>Sil</a>
            </Popconfirm>
          ) : null,
        ],
      },
    ],
    [message],
  );

  return (
    <PageContainer
      title="Ürünler"
      subTitle="Product tablosu — SKU, fiyat, PFOS / e-ticaret"
    >
      <ProTable<AdminUrunApiRow>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ marka: filterMarka, kategori: filterKategori }}
        request={async (params) => {
          const { rows, source: src, error } = await fetchUrunler({
            marka: filterMarka,
            kategori: filterKategori,
            q: typeof params.ad === "string" ? params.ad : undefined,
          });
          if (error) {
            message.error(error);
            return { data: [], success: false, total: 0 };
          }
          setSource(src);
          let data = rows;
          const skuQ = typeof params.sku === "string" ? params.sku.trim() : "";
          if (skuQ) {
            const low = skuQ.toLowerCase();
            data = data.filter(
              (r) =>
                (r.sku || "").toLowerCase().includes(low) ||
                r.ad.toLowerCase().includes(low),
            );
          }
          return { data, success: true, total: data.length };
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: "auto" }}
        headerTitle="Ürün listesi"
        toolBarRender={() => [
          <Select
            key="marka"
            allowClear
            placeholder="Marka filtresi"
            style={{ minWidth: 160 }}
            options={brandOptions}
            value={filterMarka}
            onChange={(v) => {
              setFilterMarka(v);
              actionRef.current?.reload();
            }}
          />,
          <Select
            key="kat"
            allowClear
            placeholder="Kategori filtresi"
            style={{ minWidth: 160 }}
            options={categoryOptions}
            value={filterKategori}
            onChange={(v) => {
              setFilterKategori(v);
              actionRef.current?.reload();
            }}
          />,
          source ? (
            <Tag key="src" color={source === "db" ? "blue" : "orange"}>
              {source === "db" ? "PostgreSQL" : source}
            </Tag>
          ) : null,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni ürün
          </Button>,
        ]}
        scroll={{ x: 1100 }}
      />

      <ModalForm<FormValues>
        title={editing ? "Ürün düzenle" : "Yeni ürün"}
        open={modalOpen}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setModalOpen(false);
            setEditing(null);
          },
        }}
        initialValues={
          editing
            ? {
                ad: editing.ad,
                sku: editing.sku || undefined,
                marka_id: editing.marka_id || undefined,
                kategori: editing.kategori,
                fiyat_tl: editing.fiyat_tl,
                el_guc: editing.el_guc ?? undefined,
                gaz_guc: editing.gaz_guc ?? undefined,
                stok: editing.stok ?? 0,
                durum: editing.durum,
              }
            : {
                durum: "aktif",
                stok: 0,
                marka_id: brands[0]?.slug,
                kategori: categories[0]?.slug || "pisirme",
              }
        }
        onFinish={async (values) => {
          const r = await saveUrun(
            {
              ad: values.ad,
              sku: values.sku,
              marka_id: values.marka_id,
              kategori: values.kategori,
              fiyat_tl: values.fiyat_tl,
              el_guc: values.el_guc ?? null,
              gaz_guc: values.gaz_guc ?? null,
              stok: values.stok,
              durum: values.durum,
              aciklama: values.aciklama,
            },
            editing?.id,
          );
          if (!r.ok) {
            message.error(r.error || "Kayıt başarısız");
            return false;
          }
          message.success(editing ? "Güncellendi" : "Eklendi");
          setModalOpen(false);
          setEditing(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="sku" label="SKU" placeholder="INO-FBE20T" />
        <ProFormText
          name="ad"
          label="Ürün adı"
          rules={[{ required: true, message: "Ad zorunlu" }]}
        />
        <ProFormSelect
          name="marka_id"
          label="Marka"
          options={brandOptions}
          rules={[{ required: true }]}
          showSearch
        />
        <ProFormSelect
          name="kategori"
          label="Kategori"
          options={categoryOptions}
          rules={[{ required: true }]}
          showSearch
        />
        <ProFormDigit
          name="fiyat_tl"
          label="Fiyat (TL)"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="el_guc"
          label="Elektrik (kW)"
          min={0}
          fieldProps={{ precision: 2, step: 0.1 }}
        />
        <ProFormDigit
          name="gaz_guc"
          label="Gaz (kW)"
          min={0}
          fieldProps={{ precision: 2, step: 0.1 }}
        />
        <ProFormDigit name="stok" label="Stok" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSelect
          name="durum"
          label="Durum"
          options={[
            { label: "Aktif (yayında)", value: "aktif" },
            { label: "Pasif (taslak)", value: "pasif" },
          ]}
        />
        <ProFormTextArea name="aciklama" label="Açıklama" fieldProps={{ rows: 3 }} />
      </ModalForm>
    </PageContainer>
  );
}
