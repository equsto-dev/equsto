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
  Tag,
  Typography,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PFOS_KONSEPT_SHOP_TYPES,
  enrichShopTypesFromFile,
  mergeShopTypes,
  type ShopTypeKayit,
} from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";
import {
  createStarterEqSets,
  createStarterRules,
  type ProjeAkisEqSetRow as EqSetRow,
  type ProjeAkisRuleRow as RuleRow,
} from "@/lib/pfos/proje-akis/set-kural-taslak";
import {
  EMPTY_PROJE_AKIS,
  fetchProjeAkis,
  saveProjeAkis,
  type ProjeAkisData,
} from "@/lib/pro-admin-client";

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
    if (Array.isArray(loaded.shopTypes)) {
      loaded.shopTypes = enrichShopTypesFromFile(loaded.shopTypes);
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

  const shopTypes = enrichShopTypesFromFile(
    Array.isArray(data?.shopTypes) ? data.shopTypes : [],
  );
  const questions = (data?.questions ?? []) as Record<string, unknown>[];
  const rules = (data?.rules ?? []) as RuleRow[];
  const eqSets = (data?.eqSets ?? []) as EqSetRow[];
  const products = data?.products ?? [];
  const setConceptIds = new Set(eqSets.map((s) => s.typeId).filter(Boolean));
  const ruleSetIds = new Set(rules.map((r) => r.setId).filter(Boolean));
  const activeConcepts = shopTypes.filter((t) => t.pfos.durum !== "planlanan");
  const conceptsWithoutSet = activeConcepts.filter((t) => !setConceptIds.has(t.id));
  const setsWithoutRule = eqSets.filter((s) => !ruleSetIds.has(s.id));

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Statistic title="Konsept" value={shopTypes.length} loading={loading} />
        <Statistic title="Sorular" value={questions.length} loading={loading} />
        <Statistic title="Kurallar" value={rules.length} loading={loading} />
        <Statistic title="Setler" value={eqSets.length} loading={loading} />
        <Statistic title="PFOS ürün" value={products.length} loading={loading} />
      </div>

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
            label: `Set & Kural (${eqSets.length}/${rules.length})`,
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Set ve kural taslakları"
                  description="Bu alan proje-akis.json içindeki eqSets ve rules bloklarını yönetim paneline taşımak için ilk çalışma alanı. Üretilen taslaklar ürün seçimi yapmaz; konsept, m² bandı ve referans liste bağlantısını kurar."
                />
                <Space style={{ marginBottom: 12 }} wrap>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => {
                      const nextSets = createStarterEqSets(shopTypes);
                      const next = { ...withBase(), eqSets: nextSets };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Konseptlerden set taslağı üret
                  </Button>
                  <Button
                    loading={saving}
                    disabled={!eqSets.length}
                    onClick={() => {
                      const nextRules = createStarterRules(shopTypes, eqSets);
                      const next = { ...withBase(), rules: nextRules };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Setlerden kural taslağı üret
                  </Button>
                  <Button
                    loading={saving}
                    onClick={() => {
                      const next = { ...withBase(), eqSets: [], rules: [] };
                      setData(next);
                      persist(next);
                    }}
                  >
                    Set ve kuralları temizle
                  </Button>
                </Space>
                <Space size="large" style={{ marginBottom: 12 }} wrap>
                  <Statistic title="Aktif konsept" value={activeConcepts.length} />
                  <Statistic title="Setsiz konsept" value={conceptsWithoutSet.length} />
                  <Statistic title="Kuralsız set" value={setsWithoutRule.length} />
                </Space>
                <Tabs
                  size="small"
                  items={[
                    {
                      key: "sets",
                      label: `Setler (${eqSets.length})`,
                      children: (
                        <Table<EqSetRow & { key: string }>
                          size="small"
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 1000 }}
                          dataSource={eqSets.map((s) => ({ ...s, key: s.id }))}
                          columns={[
                            { title: "Set ID", dataIndex: "id", width: 220 },
                            { title: "Set adı", dataIndex: "name", width: 240 },
                            {
                              title: "Konsept",
                              dataIndex: "typeId",
                              width: 180,
                              render: (v) => (
                                <Typography.Text code style={{ fontSize: 11 }}>
                                  {String(v || "-")}
                                </Typography.Text>
                              ),
                            },
                            {
                              title: "Kaynak",
                              dataIndex: "source",
                              width: 260,
                              render: (v) => (
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                  {String(v || "-")}
                                </Typography.Text>
                              ),
                            },
                            {
                              title: "Ürün",
                              width: 80,
                              render: (_, row) => row.selectedIds?.length ?? 0,
                            },
                            { title: "Not", dataIndex: "desc" },
                          ]}
                        />
                      ),
                    },
                    {
                      key: "rules",
                      label: `Kurallar (${rules.length})`,
                      children: (
                        <Table<RuleRow & { key: string }>
                          size="small"
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 1000 }}
                          dataSource={rules.map((r) => ({ ...r, key: r.id }))}
                          columns={[
                            { title: "Kural ID", dataIndex: "id", width: 240 },
                            {
                              title: "Konsept",
                              dataIndex: "typeId",
                              width: 160,
                              render: (v) => (
                                <Typography.Text code style={{ fontSize: 11 }}>
                                  {String(v || "-")}
                                </Typography.Text>
                              ),
                            },
                            { title: "Set", dataIndex: "setId", width: 220 },
                            { title: "Öncelik", dataIndex: "priority", width: 80 },
                            {
                              title: "Koşullar",
                              width: 260,
                              render: (_, row) => (
                                <Space wrap size={[4, 4]}>
                                  {(row.conditions ?? []).map((c, i) => (
                                    <Tag key={`${row.id}-${i}`}>
                                      {c.label || c.questionId}: {c.value}
                                    </Tag>
                                  ))}
                                </Space>
                              ),
                            },
                            { title: "Not", dataIndex: "desc" },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </>
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
