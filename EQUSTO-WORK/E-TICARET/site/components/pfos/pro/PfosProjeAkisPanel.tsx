"use client";

import { ExportOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PFOS_KONSEPT_SHOP_TYPES,
  mergeShopTypes,
  normalizeShopType,
  type ShopTypeKayit,
} from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";
import {
  EMPTY_PROJE_AKIS,
  fetchProjeAkis,
  saveProjeAkis,
  type ProjeAkisData,
} from "@/lib/pro-admin-client";

type RuleRow = {
  id: string;
  typeId: string;
  setId: string;
  desc?: string;
  conditions?: { label: string; value: string }[];
};

type EqSetRow = { id: string; name: string; selectedIds?: string[] };

export default function PfosProjeAkisPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjeAkisData>(EMPTY_PROJE_AKIS);
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthWarning(null);
    const res = await fetchProjeAkis();
    if (res.error) {
      setError(res.error);
      if (res.error.toLowerCase().includes("yetkisiz")) {
        setAuthWarning(
          "Kaydetmek için /yonetim/giris token gerekir; okuma herkese açık.",
        );
      }
    }
    const loaded = { ...EMPTY_PROJE_AKIS, ...(res.data ?? {}) };
    if (!Array.isArray(loaded.questions) || loaded.questions.length === 0) {
      loaded.questions = DEFAULT_WIZARD_QUESTIONS;
    }
    setData(loaded);
    setLoading(false);
  }, []);

  const withBase = (): ProjeAkisData => ({ ...EMPTY_PROJE_AKIS, ...data });

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next: ProjeAkisData) => {
    setSaving(true);
    const res = await saveProjeAkis(next);
    setSaving(false);
    if (res.error) {
      message.error(res.error);
      return;
    }
    setData(res.data ?? next);
    message.success("proje-akis.json kaydedildi");
  };

  const shopTypes = ((data?.shopTypes ?? []) as Record<string, unknown>[]).map(
    normalizeShopType,
  );
  const questions = (data?.questions ?? []) as Record<string, unknown>[];
  const rules = (data?.rules ?? []) as RuleRow[];
  const eqSets = (data?.eqSets ?? []) as EqSetRow[];
  const products = data?.products ?? [];

  return (
    <ProCard
      title="Proje akışı (legacy pfos.html)"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Yenile
          </Button>
          <Button
            icon={<ExportOutlined />}
            href="/admin.html"
            target="_blank"
          >
            Tam editör (admin.html)
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        <strong>Adım 1 — Konsept:</strong> Müşteri sihirbazında görünen işletme
        tipi (<code>shopTypes</code>). Her satırda <strong>motor slug</strong>{" "}
        (Teklif oluştur) ve <strong>m² bantları</strong> (Kategoriler
        listeleri) tanımlı olmalı.
      </Typography.Paragraph>

      {authWarning && (
        <Alert type="warning" showIcon message={authWarning} style={{ marginBottom: 16 }} />
      )}

      {error && !error.toLowerCase().includes("yetkisiz") && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          action={
            <Link href="/yonetim/giris">Giriş</Link>
          }
        />
      )}

      <Space size="large" style={{ marginBottom: 16 }} wrap>
        <Statistic title="Sorular" value={questions.length} loading={loading} />
        <Statistic title="Konsept" value={shopTypes.length} loading={loading} />
        <Statistic title="Kurallar" value={rules.length} loading={loading} />
        <Statistic title="Setler" value={eqSets.length} loading={loading} />
        <Statistic title="PFOS ürün" value={products.length} loading={loading} />
      </Space>

      <Tabs
        items={[
          {
            key: "konsept",
            label: `Konsept (${shopTypes.length})`,
            children: (
              <>
                <Space style={{ marginBottom: 12 }} wrap>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => {
                      const next = {
                        ...withBase(),
                        shopTypes: PFOS_KONSEPT_SHOP_TYPES,
                      };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Konsept yükle
                  </Button>
                  <Button
                    loading={saving}
                    onClick={() => {
                      const next = {
                        ...withBase(),
                        shopTypes: mergeShopTypes(
                          shopTypes,
                          PFOS_KONSEPT_SHOP_TYPES,
                        ),
                      };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Eksikleri ekle (birleştir)
                  </Button>
                  <Button
                    loading={saving}
                    onClick={() => {
                      const next = { ...withBase(), shopTypes: [] };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Konseptleri temizle
                  </Button>
                </Space>
                <Table<ShopTypeKayit & { key: string }>
                  size="small"
                  pagination={false}
                  loading={loading}
                  scroll={{ x: 1100 }}
                  dataSource={shopTypes.map((t) => ({ ...t, key: t.id }))}
                  columns={[
                    { title: "ID (legacy)", dataIndex: "id", width: 168 },
                    { title: "Görünen ad", dataIndex: "name", width: 160 },
                    {
                      title: "Üst grup",
                      dataIndex: "parent",
                      width: 100,
                    },
                    {
                      title: "Motor slug",
                      width: 120,
                      render: (_, t) => (
                        <Typography.Text code>
                          {t.pfos.motorSlug || "—"}
                        </Typography.Text>
                      ),
                    },
                    {
                      title: "Dükkan seçimi",
                      width: 130,
                      render: (_, t) => t.pfos.dukkanSecim || "—",
                    },
                    {
                      title: "m²",
                      width: 90,
                      render: (_, t) =>
                        t.pfos.m2Min
                          ? `${t.pfos.m2Min}–${t.pfos.m2Max}`
                          : "—",
                    },
                    {
                      title: "Ekipman bantları",
                      render: (_, t) =>
                        t.pfos.bantlar.length ? (
                          <span style={{ fontSize: 12 }}>
                            {t.pfos.bantlar
                              .map(
                                (b) =>
                                  `${b.label} (ref ${b.referansM2} m²)`,
                              )
                              .join(" · ")}
                          </span>
                        ) : (
                          <Typography.Text type="secondary">
                            {t.pfos.teklifKaynagi === "motor-sablon"
                              ? "Motor şablonu"
                              : "—"}
                          </Typography.Text>
                        ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: "sorular",
            label: `Sorular (${questions.length})`,
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={`Soru seti v3 (${DEFAULT_WIZARD_QUESTIONS.length} kart)`}
                  description="Kaydetmek için Bearer token gerekir. Liste boşsa otomatik önizleme gösterilir; kalıcı kayıt için aşağıdaki düğmeye basın."
                />
                <Space style={{ marginBottom: 12 }} wrap>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => {
                      const next = {
                        ...withBase(),
                        questions: DEFAULT_WIZARD_QUESTIONS,
                      };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Soruları kaydet ({DEFAULT_WIZARD_QUESTIONS.length})
                  </Button>
                  <Button
                    loading={saving}
                    onClick={() => {
                      const next = {
                        ...withBase(),
                        questions: DEFAULT_WIZARD_QUESTIONS,
                        shopTypes: mergeShopTypes(
                          shopTypes,
                          PFOS_KONSEPT_SHOP_TYPES,
                        ),
                      };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Tam set: soru + konsept kaydet
                  </Button>
                </Space>
                <Table
                  size="small"
                  pagination={{ pageSize: 12 }}
                  loading={loading}
                  scroll={{ x: 900 }}
                  dataSource={questions.map((q, i) => ({
                    key: String(q.id ?? i),
                    id: q.id,
                    step: q.step,
                    panel: q.panel,
                    text: q.text,
                    type: q.type,
                    mapsTo: q.mapsTo,
                    motorEtkisi: q.motorEtkisi,
                    gosterIf: q.gosterIf,
                  }))}
                  columns={[
                    { title: "ID", dataIndex: "id", width: 140 },
                    { title: "Adım", dataIndex: "step", width: 48 },
                    { title: "Panel", dataIndex: "panel", width: 48 },
                    { title: "Soru", dataIndex: "text", width: 200 },
                    { title: "Tip", dataIndex: "type", width: 110 },
                    {
                      title: "mapsTo",
                      dataIndex: "mapsTo",
                      width: 160,
                      render: (v) =>
                        v ? (
                          <Typography.Text code style={{ fontSize: 11 }}>
                            {String(v)}
                          </Typography.Text>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      title: "Motor",
                      dataIndex: "motorEtkisi",
                      ellipsis: true,
                      render: (v) => (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {v ? String(v) : "—"}
                        </Typography.Text>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: "set-kural",
            label: "Set & Kural",
            children: (
              <Alert
                type="info"
                showIcon
                message="Set ve kural henüz panelden düzenlenmiyor"
                description={
                  <>
                    Ekipman seti + kural zinciri için şimdilik{" "}
                    <strong>admin.html</strong> → Setler / Kurallar. Motor
                    (B) steakhouse/balikci için referans listesi yeterli.
                  </>
                }
              />
            ),
          },
          {
            key: "urun",
            label: `PFOS ürün (${products.length})`,
            children: (
              <Alert
                type="info"
                showIcon
                message="Ürün kataloğu"
                description={
                  <>
                    {products.length.toLocaleString("tr-TR")} ürün kayıtlı.
                    Yönetim:{" "}
                    <Link href="/yonetim/urunler">Ürünler</Link> veya admin →
                    Ürünler sekmesi.
                  </>
                }
              />
            ),
          },
        ]}
      />

      <Button
          type="default"
          icon={<SaveOutlined />}
          loading={saving}
          style={{ marginTop: 16 }}
          onClick={() => persist(withBase())}
        >
          Mevcut hali kaydet
        </Button>
    </ProCard>
  );
}
