"use client";

import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ProTable, StatisticCard } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  approvePfosSkuLinkOneri,
  createPfosFiyatKurali,
  deletePfosUrunTipiEslesme,
  fetchPfosFeedback,
  fetchPfosFeedbackDetail,
  fetchPfosFiyatKurallari,
  fetchPfosSkuLinkOneri,
  fetchPfosUrunTipiEslesme,
  exportPfosReferansSkuLinks,
  importPfosIyilestirme,
  patchPfosFeedback,
  rejectPfosSkuLinkOneri,
  togglePfosFiyatKurali,
  upsertPfosUrunTipiEslesme,
  type PfosFeedbackAdminRow,
  type PfosFiyatKuraliAdminRow,
  type PfosSkuLinkOneriRow,
  type PfosUrunTipiEslesmeRow,
} from "@/lib/pro-admin-client";
import { pfosDisplayText, pfosGuvenYuzdeMetin } from "@/lib/pfos/format-display";
import {
  isHighPriorityFeedback,
  pfosFeedbackPriorityLabel,
  pfosFeedbackPriorityScore,
} from "@/lib/pfos/feedback-priority";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

function voteTag(vote: string) {
  if (vote === "up") return <Tag color="green">👍</Tag>;
  if (vote === "down") return <Tag color="red">👎</Tag>;
  return <Tag>{vote}</Tag>;
}

function durumTag(durum: string) {
  if (durum === "pending_review") return <Tag color="orange">Bekliyor</Tag>;
  if (durum === "reviewed") return <Tag color="green">İncelendi</Tag>;
  if (durum === "dismissed") return <Tag>Reddedildi</Tag>;
  if (durum === "pending") return <Tag color="gold">Öneri bekliyor</Tag>;
  if (durum === "approved") return <Tag color="green">Onaylı</Tag>;
  if (durum === "rejected") return <Tag color="red">Red</Tag>;
  return <Tag>{durum}</Tag>;
}

function FeedbackTab({
  days,
  onDaysChange,
}: {
  days: number;
  onDaysChange: (d: number) => void;
}) {
  const { message } = App.useApp();
  const tablePagination = useAdminTablePagination();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PfosFeedbackAdminRow[]>([]);
  const [ozet, setOzet] = useState<{
    pending_review?: number;
    oneri_bekleyen?: number;
    down?: number;
  } | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchPfosFeedbackDetail>
  >["data"] | null>(null);
  const [oneriSku, setOneriSku] = useState<Record<string, string>>({});
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high">("all");

  const displayRows =
    priorityFilter === "high"
      ? rows.filter(isHighPriorityFeedback)
      : rows;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPfosFeedback({ days, limit: 200 });
    if (res.error) message.warning(res.error);
    setRows(res.rows ?? []);
    setOzet(res.ozet ?? null);
    setLoading(false);
  }, [days, message]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDrawerId(id);
    setDetailLoading(true);
    const res = await fetchPfosFeedbackDetail(id);
    if (res.error) message.error(res.error);
    setDetail(res.data ?? null);
    const skuMap: Record<string, string> = {};
    for (const o of res.data?.oneriler ?? []) {
      if (o.yeni_sku) skuMap[o.id] = o.yeni_sku;
    }
    setOneriSku(skuMap);
    setDetailLoading(false);
  };

  const columns: ProColumns<PfosFeedbackAdminRow>[] = [
    {
      title: "Öncelik",
      width: 72,
      render: (_, r) => {
        const s = pfosFeedbackPriorityScore(r);
        const label = pfosFeedbackPriorityLabel(s);
        if (label === "yüksek") return <Tag color="red">Yüksek</Tag>;
        if (label === "orta") return <Tag color="orange">Orta</Tag>;
        if (label === "düşük") return <Tag>Düşük</Tag>;
        return <Tag color="default">—</Tag>;
      },
    },
    {
      title: "Tarih",
      dataIndex: "created_at",
      width: 140,
      render: (v) =>
        new Date(String(v)).toLocaleString("tr-TR", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    { title: "Teklif", dataIndex: "teklif_sayi", width: 120, ellipsis: true },
    {
      title: "Konsept",
      dataIndex: "konsept_label",
      ellipsis: true,
      render: (_, r) => pfosDisplayText(r.konsept_label ?? r.konsept),
    },
    {
      title: "m²",
      dataIndex: "m2",
      width: 56,
      render: (v) => (v != null ? String(v) : "—"),
    },
    {
      title: "Güven",
      dataIndex: "guven_skoru",
      width: 72,
      render: (v) => pfosGuvenYuzdeMetin(v != null ? Number(v) : null),
    },
    {
      title: "Oy",
      dataIndex: "vote",
      width: 56,
      render: (v) => voteTag(String(v)),
    },
    {
      title: "Öneri",
      dataIndex: "oneri_sayisi",
      width: 64,
      render: (v) => (v != null && Number(v) > 0 ? String(v) : "—"),
    },
    {
      title: "Durum",
      dataIndex: "durum",
      width: 110,
      render: (v) => durumTag(String(v)),
    },
    {
      title: "",
      width: 88,
      render: (_, r) => (
        <Button size="small" onClick={() => openDetail(r.id)}>
          Detay
        </Button>
      ),
    },
  ];

  const snapshotKalemler = Array.isArray(detail?.snapshot?.kalemler)
    ? (detail.snapshot.kalemler as Array<Record<string, unknown>>)
    : [];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Bekleyen 👎",
              value: ozet?.pending_review ?? 0,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Bekleyen öneri",
              value: ozet?.oneri_bekleyen ?? 0,
            }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "👎 (dönem)", value: ozet?.down ?? 0 }}
          />
        </Col>
      </Row>

      <ProTable<PfosFeedbackAdminRow>
        rowKey="id"
        loading={loading}
        search={false}
        options={false}
        pagination={tablePagination}
        headerTitle="Geri bildirimler"
        toolBarRender={() => [
          <a key="d7" onClick={() => onDaysChange(7)}>
            7 gün
          </a>,
          <a key="d30" onClick={() => onDaysChange(30)}>
            30 gün
          </a>,
          <a key="d90" onClick={() => onDaysChange(90)}>
            90 gün
          </a>,
          <a
            key="prio"
            onClick={() =>
              setPriorityFilter((p) => (p === "high" ? "all" : "high"))
            }
          >
            {priorityFilter === "high" ? "Tümü" : "Yüksek öncelik"}
          </a>,
          <Button key="reload" icon={<ReloadOutlined />} onClick={load}>
            Yenile
          </Button>,
        ]}
        dataSource={displayRows}
        columns={columns}
      />

      <Drawer
        title={detail?.feedback?.teklif_sayi || "Geri bildirim"}
        width={720}
        open={!!drawerId}
        onClose={() => {
          setDrawerId(null);
          setDetail(null);
        }}
        loading={detailLoading}
      >
        {detail?.feedback && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Konsept">
                {pfosDisplayText(
                  detail.feedback.konsept_label ?? detail.feedback.konsept,
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Oy">
                {voteTag(detail.feedback.vote)}
              </Descriptions.Item>
              <Descriptions.Item label="m²">
                {detail.feedback.m2 ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Güven">
                {pfosGuvenYuzdeMetin(detail.feedback.guven_skoru)}
              </Descriptions.Item>
              <Descriptions.Item label="Liste key" span={2}>
                {detail.feedback.referans_liste_key || "—"}
              </Descriptions.Item>
              {detail.feedback.yorum && (
                <Descriptions.Item label="Yorum" span={2}>
                  {detail.feedback.yorum}
                </Descriptions.Item>
              )}
            </Descriptions>

            {snapshotKalemler.length > 0 && (
              <>
                <Typography.Title level={5}>Snapshot kalemleri</Typography.Title>
                <Table
                  size="small"
                  pagination={false}
                  style={{ marginBottom: 16 }}
                  rowKey={(r) => String(r.poz)}
                  dataSource={snapshotKalemler}
                  columns={[
                    { title: "Poz", dataIndex: "poz", width: 56 },
                    { title: "İsim", dataIndex: "isim", ellipsis: true },
                    { title: "SKU", dataIndex: "sku", width: 120 },
                    {
                      title: "Katman",
                      dataIndex: "eslesmeKatmani",
                      width: 100,
                      render: (v) => v || "—",
                    },
                  ]}
                />
              </>
            )}

            <Typography.Title level={5}>SKU önerileri</Typography.Title>
            {(detail.oneriler ?? []).length === 0 ? (
              <Typography.Text type="secondary">Öneri yok</Typography.Text>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                {(detail.oneriler ?? []).map((o) => (
                  <OneriCard
                    key={o.id}
                    oneri={o}
                    sku={oneriSku[o.id] ?? o.yeni_sku}
                    onSkuChange={(sku) =>
                      setOneriSku((prev) => ({ ...prev, [o.id]: sku }))
                    }
                    onDone={async () => {
                      await load();
                      if (drawerId) await openDetail(drawerId);
                    }}
                  />
                ))}
              </Space>
            )}

            <Space style={{ marginTop: 16 }}>
              {detail.feedback.durum === "pending_review" && (
                <>
                  <Button
                    onClick={async () => {
                      const res = await patchPfosFeedback(
                        detail.feedback.id,
                        "reviewed",
                      );
                      if (!res.ok) message.error(res.error);
                      else {
                        message.success("İncelendi olarak işaretlendi");
                        load();
                        setDrawerId(null);
                      }
                    }}
                  >
                    Kapat (incelendi)
                  </Button>
                  <Button
                    danger
                    onClick={async () => {
                      const res = await patchPfosFeedback(
                        detail.feedback.id,
                        "dismissed",
                      );
                      if (!res.ok) message.error(res.error);
                      else {
                        message.success("Geçersiz olarak işaretlendi");
                        load();
                        setDrawerId(null);
                      }
                    }}
                  >
                    Geçersiz
                  </Button>
                </>
              )}
            </Space>
          </>
        )}
      </Drawer>
    </>
  );
}

function OneriCard({
  oneri,
  sku,
  onSkuChange,
  onDone,
}: {
  oneri: PfosSkuLinkOneriRow;
  sku: string;
  onSkuChange: (sku: string) => void;
  onDone: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);

  if (oneri.durum !== "pending") {
    return (
      <Alert
        type={oneri.durum === "approved" ? "success" : "info"}
        message={`${oneri.poz} — ${oneri.link_key}`}
        description={
          <>
            {durumTag(oneri.durum)} · {oneri.sorun_tipi}
            {oneri.yeni_sku ? ` · SKU: ${oneri.yeni_sku}` : null}
          </>
        }
      />
    );
  }

  return (
    <Alert
      type="warning"
      message={`${oneri.poz} — ${oneri.eski_ad || oneri.eski_sku || "?"}`}
      description={
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            {oneri.sorun_tipi} · {oneri.link_key}
          </Typography.Text>
          {oneri.sorun_tipi !== "fiyat_kurali" && (
            <Input
              placeholder="Doğru SKU"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
            />
          )}
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const res = await approvePfosSkuLinkOneri(oneri.id, {
                  yeniSku: sku,
                });
                setBusy(false);
                if (!res.ok) message.error(res.error);
                else {
                  message.success("Onaylandı");
                  await onDone();
                }
              }}
            >
              Onayla
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const res = await rejectPfosSkuLinkOneri(
                  oneri.id,
                  "Admin reddi",
                );
                setBusy(false);
                if (!res.ok) message.error(res.error);
                else {
                  message.success("Reddedildi");
                  await onDone();
                }
              }}
            >
              Reddet
            </Button>
          </Space>
        </Space>
      }
    />
  );
}

function TipEslesmeTab() {
  const { message } = App.useApp();
  const tablePagination = useAdminTablePagination();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PfosUrunTipiEslesmeRow[]>([]);
  const [konseptFilter, setKonseptFilter] = useState("");
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPfosUrunTipiEslesme({
      konsept: konseptFilter || undefined,
    });
    if (res.error) message.warning(res.error);
    setRows(res.rows ?? []);
    setLoading(false);
  }, [konseptFilter, message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Konsept × PFOS ürün tipi → katalog ürünü eşlemesi"
      />
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}
        onFinish={async (vals) => {
          const res = await upsertPfosUrunTipiEslesme({
            konseptSlug: vals.konseptSlug,
            pfosUrunTipi: vals.pfosUrunTipi,
            pfosKategoriKodu: vals.pfosKategoriKodu || "G",
            productId: vals.productId,
            oncelik: vals.oncelik ?? 0,
          });
          if (!res.ok) message.error(res.error);
          else {
            message.success("Kaydedildi");
            form.resetFields();
            load();
          }
        }}
      >
        <Form.Item name="konseptSlug" rules={[{ required: true }]}>
          <Input placeholder="konsept slug" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="pfosUrunTipi" rules={[{ required: true }]}>
          <Input placeholder="urun tipi" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="pfosKategoriKodu" initialValue="G">
          <Select
            style={{ width: 72 }}
            options={["A", "B", "C", "D", "E", "F", "G", "H", "X"].map((v) => ({
              value: v,
              label: v,
            }))}
          />
        </Form.Item>
        <Form.Item name="productId" rules={[{ required: true }]}>
          <Input placeholder="product cuid" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="oncelik" initialValue={0}>
          <InputNumber placeholder="öncelik" style={{ width: 80 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Ekle / güncelle
          </Button>
        </Form.Item>
      </Form>

      <Space style={{ marginBottom: 12 }}>
        <Input
          placeholder="Konsept filtresi"
          value={konseptFilter}
          onChange={(e) => setKonseptFilter(e.target.value)}
          style={{ width: 180 }}
        />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Yenile
        </Button>
      </Space>

      <ProTable<PfosUrunTipiEslesmeRow>
        rowKey="id"
        loading={loading}
        search={false}
        options={false}
        pagination={tablePagination}
        dataSource={rows}
        columns={[
          { title: "Konsept", dataIndex: "konsept_slug", width: 120 },
          { title: "Ürün tipi", dataIndex: "pfos_urun_tipi", ellipsis: true },
          { title: "Kat.", dataIndex: "pfos_kategori_kodu", width: 48 },
          { title: "SKU", dataIndex: "product_sku", width: 120 },
          { title: "Ürün", dataIndex: "product_ad", ellipsis: true },
          { title: "Önc.", dataIndex: "oncelik", width: 56 },
          {
            title: "",
            width: 56,
            render: (_, r) => (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={async () => {
                  const res = await deletePfosUrunTipiEslesme(r.id);
                  if (!res.ok) message.error(res.error);
                  else {
                    message.success("Silindi");
                    load();
                  }
                }}
              />
            ),
          },
        ]}
      />
    </>
  );
}

function FiyatKuraliTab() {
  const { message } = App.useApp();
  const tablePagination = useAdminTablePagination();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PfosFiyatKuraliAdminRow[]>([]);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPfosFiyatKurallari();
    if (res.error) message.warning(res.error);
    setRows(res.rows ?? []);
    setLoading(false);
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Doğru ürün, özel fiyat — örn. tava rafı ×4"
      />
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}
        onFinish={async (vals) => {
          const res = await createPfosFiyatKurali({
            isimKalibi: vals.isimKalibi,
            kuralTipi: "carp",
            carpan: vals.carpan,
            aciklama: vals.aciklama,
            listeKey: vals.listeKey,
            poz: vals.poz,
          });
          if (!res.ok) message.error(res.error);
          else {
            message.success("Kural eklendi");
            form.resetFields();
            load();
          }
        }}
      >
        <Form.Item name="isimKalibi">
          <Input placeholder="isim kalıbı (tava raf)" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="carpan" initialValue={4}>
          <InputNumber placeholder="çarpan" style={{ width: 80 }} />
        </Form.Item>
        <Form.Item name="poz">
          <Input placeholder="poz (ops.)" style={{ width: 72 }} />
        </Form.Item>
        <Form.Item name="listeKey">
          <Input placeholder="liste key (ops.)" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="aciklama">
          <Input placeholder="açıklama" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Kural ekle
          </Button>
        </Form.Item>
      </Form>

      <ProTable<PfosFiyatKuraliAdminRow>
        rowKey="id"
        loading={loading}
        search={false}
        options={false}
        pagination={tablePagination}
        headerTitle="Fiyat kuralları"
        toolBarRender={() => [
          <Button key="reload" icon={<ReloadOutlined />} onClick={load}>
            Yenile
          </Button>,
        ]}
        dataSource={rows}
        columns={[
          { title: "Kapsam", dataIndex: "kapsam", width: 88 },
          { title: "İsim kalıbı", dataIndex: "isim_kalibi", ellipsis: true },
          { title: "Poz", dataIndex: "poz", width: 56 },
          { title: "Tip", dataIndex: "kural_tipi", width: 72 },
          {
            title: "×",
            dataIndex: "carpan",
            width: 48,
            render: (v) => (v != null ? String(v) : "—"),
          },
          { title: "Kaynak", dataIndex: "kaynak", width: 88 },
          {
            title: "Aktif",
            dataIndex: "aktif",
            width: 72,
            render: (v, r) => (
              <Switch
                checked={!!v}
                onChange={async (checked) => {
                  const res = await togglePfosFiyatKurali(r.id, checked);
                  if (!res.ok) message.error(res.error);
                  else load();
                }}
              />
            ),
          },
        ]}
      />
    </>
  );
}

function OneriKuyrukTab() {
  const { message } = App.useApp();
  const tablePagination = useAdminTablePagination();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PfosSkuLinkOneriRow[]>([]);
  const [skuEdits, setSkuEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPfosSkuLinkOneri({ durum: "pending" });
    if (res.error) message.warning(res.error);
    setRows(res.rows ?? []);
    const edits: Record<string, string> = {};
    for (const r of res.rows ?? []) edits[r.id] = r.yeni_sku;
    setSkuEdits(edits);
    setLoading(false);
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProTable<PfosSkuLinkOneriRow>
      rowKey="id"
      loading={loading}
      search={false}
      options={false}
      pagination={tablePagination}
      headerTitle="Bekleyen SKU önerileri"
      toolBarRender={() => [
        <Button key="reload" icon={<ReloadOutlined />} onClick={load}>
          Yenile
        </Button>,
      ]}
      dataSource={rows}
      columns={[
        { title: "Poz", dataIndex: "poz", width: 56 },
        { title: "Liste", dataIndex: "liste_key", ellipsis: true },
        { title: "Eski SKU", dataIndex: "eski_sku", width: 120 },
        {
          title: "Yeni SKU",
          width: 160,
          render: (_, r) => (
            <Input
              size="small"
              value={skuEdits[r.id] ?? ""}
              onChange={(e) =>
                setSkuEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
              }
            />
          ),
        },
        { title: "Sorun", dataIndex: "sorun_tipi", width: 120 },
        {
          title: "",
          width: 140,
          render: (_, r) => (
            <Space>
              <Button
                size="small"
                type="primary"
                onClick={async () => {
                  const res = await approvePfosSkuLinkOneri(r.id, {
                    yeniSku: skuEdits[r.id],
                  });
                  if (!res.ok) message.error(res.error);
                  else {
                    message.success("Onaylandı");
                    load();
                  }
                }}
              >
                Onayla
              </Button>
              <Button
                size="small"
                danger
                onClick={async () => {
                  const res = await rejectPfosSkuLinkOneri(r.id, "Admin reddi");
                  if (!res.ok) message.error(res.error);
                  else {
                    message.success("Reddedildi");
                    load();
                  }
                }}
              >
                Red
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}

export default function PfosEslesmeFeedbackPanel() {
  const { message } = App.useApp();
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <>
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button
          loading={importing}
          onClick={async () => {
            setImporting(true);
            const res = await importPfosIyilestirme({
              listeKey: "s13-388-turk-220",
              teklif: "EQS-2026-650",
            });
            setImporting(false);
            if (!res.ok) message.error(res.error ?? "Import başarısız");
            else
              message.success(
                res.message ??
                  `${res.data?.skuOneriCreated ?? 0} öneri, ${res.data?.fiyatKuraliCreated ?? 0} kural`,
              );
          }}
        >
          iyileştirme.md import
        </Button>
        <Button
          icon={<ReloadOutlined />}
          loading={exporting}
          onClick={async () => {
            setExporting(true);
            const res = await exportPfosReferansSkuLinks();
            setExporting(false);
            if (!res.ok) message.error(res.error ?? "Export başarısız");
            else message.success(res.message ?? "SKU link JSON export edildi");
          }}
        >
          SKU link JSON export
        </Button>
      </div>
      <Tabs
      defaultActiveKey="feedback"
      items={[
        {
          key: "feedback",
          label: "Geri bildirimler",
          children: <FeedbackTab days={days} onDaysChange={setDays} />,
        },
        {
          key: "oneri",
          label: "SKU öneri kuyruğu",
          children: <OneriKuyrukTab />,
        },
        {
          key: "tip",
          label: "Tip eşlemeleri",
          children: <TipEslesmeTab />,
        },
        {
          key: "fiyat",
          label: "Fiyat kuralları",
          children: <FiyatKuraliTab />,
        },
      ]}
    />
    </>
  );
}
