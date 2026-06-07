"use client";

import { ProCard, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Col,
  InputNumber,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EkipmanRow } from "@/lib/pro-admin-client";
import {
  ekipmanHasFiyat,
  fetchEkipmanlarCatalog,
  fetchFiyatlarMap,
  fetchKur,
  resolveEkipmanPriceKeys,
  saveFiyatlarMap,
} from "@/lib/pro-admin-client";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

type FiyatRow = {
  key: string;
  kod: string;
  name: string;
  brand: string;
  fiyat: number | null;
  kaynak: "map" | "eur" | "eksik";
};

export default function EticaretFiyatPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kur, setKur] = useState<number | null>(null);
  const [kurMeta, setKurMeta] = useState("");
  const [fiyatMap, setFiyatMap] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<EkipmanRow[]>([]);
  const [filter, setFilter] = useState<"eksik" | "tumu">("eksik");
  const tablePagination = useAdminTablePagination(20, filter);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kurRes, fiyat, rows] = await Promise.all([
        fetchKur(),
        fetchFiyatlarMap(),
        fetchEkipmanlarCatalog(),
      ]);
      setKur(kurRes.rate ?? null);
      setKurMeta(
        [kurRes.date, kurRes.source === "fallback" ? "yedek" : "TCMB"]
          .filter(Boolean)
          .join(" · "),
      );
      setFiyatMap(fiyat.map);
      setCatalog(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tableRows = useMemo((): FiyatRow[] => {
    return catalog.map((row, i) => {
      const keys = resolveEkipmanPriceKeys(row);
      let fiyat: number | null = null;
      for (const k of keys) {
        const v = fiyatMap[k];
        if (Number.isFinite(v) && v > 0) {
          fiyat = v;
          break;
        }
      }
      const hasEur = ekipmanHasFiyat(row, fiyatMap) && fiyat == null;
      return {
        key: String(row.id || row.urun_kodu || row.sku || i),
        kod: keys[0] || "—",
        name: String(row.name || "—"),
        brand: String(row.brand || "—"),
        fiyat,
        kaynak: fiyat != null ? "map" : hasEur ? "eur" : "eksik",
      };
    });
  }, [catalog, fiyatMap]);

  const stats = useMemo(() => {
    const withPrice = tableRows.filter((r) => r.kaynak !== "eksik").length;
    const eksik = tableRows.length - withPrice;
    const mapCount = Object.keys(fiyatMap).filter(
      (k) => Number(fiyatMap[k]) > 0,
    ).length;
    return { total: tableRows.length, withPrice, eksik, mapCount };
  }, [tableRows, fiyatMap]);

  const filtered = useMemo(() => {
    if (filter === "eksik") return tableRows.filter((r) => r.kaynak === "eksik");
    return tableRows;
  }, [tableRows, filter]);

  function openEdit(kod: string, current: number | null) {
    setEditKey(kod);
    setEditValue(current);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editKey.trim()) {
      message.error("Kod zorunlu");
      return;
    }
    const v = Number(editValue);
    if (!Number.isFinite(v) || v <= 0) {
      message.error("Geçerli TL fiyat girin");
      return;
    }
    setSaving(true);
    try {
      const next = { ...fiyatMap, [editKey.trim()]: v };
      const res = await saveFiyatlarMap(next);
      if (res.error) {
        message.error(res.error);
        return;
      }
      message.success("Fiyat kaydedildi");
      setFiyatMap(next);
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <ProCard loading={loading}>
            <Statistic title="Katalog" value={stats.total} />
          </ProCard>
        </Col>
        <Col xs={12} sm={6}>
          <ProCard loading={loading}>
            <Statistic title="Fiyatlı" value={stats.withPrice} />
          </ProCard>
        </Col>
        <Col xs={12} sm={6}>
          <ProCard loading={loading}>
            <Statistic
              title="Eksik"
              value={stats.eksik}
              valueStyle={{ color: stats.eksik > 0 ? "#cf1322" : undefined }}
            />
          </ProCard>
        </Col>
        <Col xs={12} sm={6}>
          <ProCard loading={loading}>
            <Statistic
              title="EUR/TRY"
              value={kur != null ? kur.toFixed(4) : "—"}
            />
            {kurMeta && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {kurMeta}
              </Typography.Text>
            )}
          </ProCard>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Fiyat kaynakları"
        description={
          <>
            <Typography.Text code>fiyatlar.json</Typography.Text> — tip_kodu /
            sku eşleşmesi. Öztiryakiler ürünlerinde EUR × kur otomatik
            hesaplanır. Düzenleme{" "}
            <Typography.Text code>data/fiyatlar.json</Typography.Text> dosyasına
            yazılır.
          </>
        }
      />

      <ProTable<FiyatRow>
        rowKey="key"
        loading={loading}
        dataSource={filtered}
        search={false}
        pagination={tablePagination}
        headerTitle="Katalog fiyat sağlığı"
        toolbar={{
          menu: {
            type: "tab",
            activeKey: filter,
            items: [
              { key: "eksik", label: `Eksik (${stats.eksik})` },
              { key: "tumu", label: "Tümü" },
            ],
            onChange: (key) => setFilter((key as typeof filter) || "eksik"),
          },
        }}
        toolBarRender={() => [
          <Button key="reload" onClick={load}>
            Yenile
          </Button>,
        ]}
        columns={[
          { title: "Kod", dataIndex: "kod", width: 140, copyable: true },
          { title: "Ürün", dataIndex: "name", ellipsis: true },
          { title: "Marka", dataIndex: "brand", width: 140, ellipsis: true },
          {
            title: "TL",
            dataIndex: "fiyat",
            width: 120,
            render: (_, r) =>
              r.fiyat != null
                ? r.fiyat.toLocaleString("tr-TR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : "—",
          },
          {
            title: "Kaynak",
            dataIndex: "kaynak",
            width: 100,
            render: (_, r) => {
              if (r.kaynak === "map") return <Tag color="green">Liste</Tag>;
              if (r.kaynak === "eur") return <Tag color="blue">EUR/kur</Tag>;
              return <Tag color="red">Eksik</Tag>;
            },
          },
          {
            title: "",
            width: 90,
            render: (_, r) => (
              <Button
                size="small"
                type="link"
                onClick={() => openEdit(r.kod === "—" ? "" : r.kod, r.fiyat)}
              >
                Düzenle
              </Button>
            ),
          },
        ]}
        scroll={{ x: 720 }}
      />

      <Modal
        title="Fiyat düzenle"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={saveEdit}
        confirmLoading={saving}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">tip_kodu / sku anahtarı</Typography.Text>
          <Typography.Paragraph copyable={{ text: editKey }}>
            <Typography.Text code>{editKey || "—"}</Typography.Text>
          </Typography.Paragraph>
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            step={100}
            addonAfter="TL"
            value={editValue}
            onChange={(v) => setEditValue(typeof v === "number" ? v : null)}
            placeholder="KDV hariç liste fiyatı"
          />
        </Space>
      </Modal>
    </>
  );
}
