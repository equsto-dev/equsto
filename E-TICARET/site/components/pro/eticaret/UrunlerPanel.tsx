"use client";

import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminUrunApiRow, UrunMetaBrand, UrunMetaCategory } from "@/lib/pro-admin-client";
import {
  deleteUrun,
  fetchUrunler,
  fetchUrunlerMeta,
  saveUrun,
} from "@/lib/pro-admin-client";
import {
  computeUrunHealthStats,
  matchesUrunQuickFilter,
  parseBulkUrunCsv,
  urunIssues,
  type BulkUrunRow,
  type UrunQuickFilter,
} from "@/lib/pro/urun-health";

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

const QUICK_FILTERS: { value: UrunQuickFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "eksik", label: "Eksik bilgi" },
  { value: "eksik-fiyat", label: "Fiyatsız" },
  { value: "eksik-sku", label: "SKU yok" },
  { value: "pasif", label: "Pasif" },
  { value: "db", label: "DB düzenlenebilir" },
];

export default function UrunlerPanel() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [brands, setBrands] = useState<UrunMetaBrand[]>([]);
  const [categories, setCategories] = useState<UrunMetaCategory[]>([]);
  const [source, setSource] = useState<string>("");
  const [filterMarka, setFilterMarka] = useState<string | undefined>();
  const [filterKategori, setFilterKategori] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<UrunQuickFilter>("all");
  const [health, setHealth] = useState(computeUrunHealthStats([]));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUrunApiRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkUrunRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);

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

  const openEdit = useCallback(
    (row: AdminUrunApiRow) => {
      if (row.readonly || row.id.startsWith("ecom_")) {
        message.info("Legacy katalog satırı — yalnızca DB ürünleri düzenlenebilir.");
        return;
      }
      setEditing(row);
      setModalOpen(true);
    },
    [message],
  );

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
        width: 220,
      },
      {
        title: "Uyarı",
        width: 140,
        search: false,
        render: (_, row) => {
          const issues = urunIssues(row);
          if (!issues.length) return <Tag color="green">Tam</Tag>;
          return (
            <Space size={[0, 4]} wrap>
              {issues.map((i) => (
                <Tag key={i} color="warning">
                  {i}
                </Tag>
              ))}
            </Space>
          );
        },
      },
      {
        title: "Kategori",
        dataIndex: "kategori_ad",
        width: 120,
        ellipsis: true,
        render: (_, row) => row.kategori_ad || row.kategori,
      },
      {
        title: "Marka",
        dataIndex: "marka_ad",
        width: 120,
        ellipsis: true,
      },
      {
        title: "Fiyat (TL)",
        dataIndex: "fiyat_tl",
        width: 110,
        search: false,
        render: (_, row) =>
          row.fiyat_tl > 0
            ? row.fiyat_tl.toLocaleString("tr-TR", { maximumFractionDigits: 0 })
            : "—",
      },
      {
        title: "Durum",
        dataIndex: "durum",
        width: 80,
        search: false,
        render: (_, row) => (
          <Tag color={row.durum === "aktif" ? "green" : "default"}>{row.durum}</Tag>
        ),
      },
      {
        title: "İşlem",
        valueType: "option",
        width: 120,
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
    [openEdit],
  );

  async function runBulkImport() {
    if (!bulkRows.length) return;
    setBulkImporting(true);
    let ok = 0;
    let fail = 0;
    for (const row of bulkRows) {
      const r = await saveUrun({
        ad: row.ad,
        sku: row.sku,
        marka_id: row.marka_id,
        kategori: row.kategori,
        fiyat_tl: row.fiyat_tl,
        durum: row.durum || "aktif",
      });
      if (r.ok) ok++;
      else fail++;
    }
    setBulkImporting(false);
    message.info(`Toplu yükleme: ${ok} eklendi, ${fail} hata`);
    setBulkOpen(false);
    setBulkRows([]);
    actionRef.current?.reload();
  }

  return (
    <>
      {health.eksik > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${health.eksik} üründe eksik bilgi`}
          description={
            <>
              Fiyatsız: {health.eksikFiyat} · SKU yok: {health.eksikSku} · Pasif:{" "}
              {health.pasif} · DB düzenlenebilir: {health.dbEditable}
            </>
          }
        />
      )}

      <Segmented
        options={QUICK_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
        value={quickFilter}
        onChange={(v) => {
          setQuickFilter(v as UrunQuickFilter);
          actionRef.current?.reload();
        }}
        style={{ marginBottom: 16 }}
      />

      <ProTable<AdminUrunApiRow>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ marka: filterMarka, kategori: filterKategori, quickFilter }}
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
          setHealth(computeUrunHealthStats(rows));
          let data = rows.filter((r) => matchesUrunQuickFilter(r, quickFilter));
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
            placeholder="Marka"
            style={{ minWidth: 140 }}
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
            placeholder="Kategori"
            style={{ minWidth: 140 }}
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
          <Button key="bulk" icon={<UploadOutlined />} onClick={() => setBulkOpen(true)}>
            Toplu yükle
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni ürün
          </Button>,
        ]}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Toplu ürün yükleme (CSV)"
        open={bulkOpen}
        onCancel={() => {
          setBulkOpen(false);
          setBulkRows([]);
          setBulkErrors([]);
        }}
        onOk={runBulkImport}
        okText="İçe aktar"
        confirmLoading={bulkImporting}
        okButtonProps={{ disabled: bulkRows.length === 0 }}
        width={720}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Sütun sırası"
          description="ad, sku, marka_id, kategori, fiyat_tl, durum — virgül veya noktalı virgül. İlk satır başlık olabilir."
        />
        <Upload
          accept=".csv,.txt"
          maxCount={1}
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const parsed = parseBulkUrunCsv(String(reader.result || ""));
              setBulkRows(parsed.rows);
              setBulkErrors(parsed.errors);
            };
            reader.readAsText(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>CSV seç</Button>
        </Upload>
        {bulkErrors.length > 0 && (
          <Alert
            type="error"
            style={{ marginTop: 12 }}
            message={`${bulkErrors.length} satır hatası`}
            description={bulkErrors.slice(0, 5).join(" · ")}
          />
        )}
        {bulkRows.length > 0 && (
          <Table
            size="small"
            style={{ marginTop: 12 }}
            rowKey={(_, i) => String(i)}
            dataSource={bulkRows}
            pagination={{ pageSize: 5 }}
            columns={[
              { title: "Ad", dataIndex: "ad", ellipsis: true },
              { title: "SKU", dataIndex: "sku", width: 100 },
              { title: "Marka", dataIndex: "marka_id", width: 100 },
              { title: "Kategori", dataIndex: "kategori", width: 100 },
              { title: "TL", dataIndex: "fiyat_tl", width: 80 },
            ]}
          />
        )}
      </Modal>

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
    </>
  );
}
