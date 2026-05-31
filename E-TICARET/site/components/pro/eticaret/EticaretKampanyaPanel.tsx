"use client";

import {
  ModalForm,
  ProCard,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { App, Button, Popconfirm, Space, Tabs, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import type {
  EticaretBanner,
  EticaretIcerik,
  EticaretKampanya,
  EticaretKupon,
} from "@/lib/pro-admin-client";
import {
  deleteEticaretItem,
  EMPTY_ETICARET_ICERIK,
  fetchEticaretIcerik,
  saveEticaretIcerik,
} from "@/lib/pro-admin-client";

export default function EticaretKampanyaPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EticaretIcerik>({ ...EMPTY_ETICARET_ICERIK });
  const [kampanyaOpen, setKampanyaOpen] = useState(false);
  const [kuponOpen, setKuponOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEticaretIcerik();
      if (res.error) message.warning(res.error);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  async function persist(next: EticaretIcerik) {
    const res = await saveEticaretIcerik(next);
    if (res.error) {
      message.error(res.error);
      return false;
    }
    setData(res.data ?? next);
    message.success("Kaydedildi");
    return true;
  }

  return (
    <>
      <AlertCompat />
      <Tabs
        items={[
          {
            key: "kampanya",
            label: `Kampanyalar (${data.k.length})`,
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={() => setKampanyaOpen(true)}>
                    Kampanya ekle
                  </Button>
                  <Button onClick={load}>Yenile</Button>
                </Space>
                <ProTable<EticaretKampanya & { _idx: number }>
                  rowKey="_idx"
                  loading={loading}
                  search={false}
                  pagination={false}
                  dataSource={data.k.map((k, _idx) => ({ ...k, _idx }))}
                  columns={[
                    { title: "Ad", dataIndex: "ad", ellipsis: true },
                    {
                      title: "Ticker metni",
                      dataIndex: "acik",
                      ellipsis: true,
                      render: (_, r) => r.acik || r.desc || "—",
                    },
                    { title: "Başlangıç", dataIndex: "start", width: 120 },
                    { title: "Bitiş", dataIndex: "end", width: 120 },
                    {
                      title: "Durum",
                      dataIndex: "active",
                      width: 90,
                      render: (_, r) =>
                        r.active ? (
                          <Tag color="green">Aktif</Tag>
                        ) : (
                          <Tag>Pasif</Tag>
                        ),
                    },
                    {
                      title: "",
                      width: 80,
                      render: (_, r) => (
                        <Popconfirm
                          title="Kampanya silinsin mi?"
                          onConfirm={async () => {
                            const res = await deleteEticaretItem(
                              "kampanya",
                              r._idx,
                            );
                            if (res.error) message.error(res.error);
                            else {
                              message.success("Silindi");
                              if (res.data) setData(res.data);
                              else load();
                            }
                          }}
                        >
                          <Button type="link" danger size="small">
                            Sil
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: "kupon",
            label: `Kuponlar (${data.kp.length})`,
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={() => setKuponOpen(true)}>
                    Kupon ekle
                  </Button>
                </Space>
                <ProTable<EticaretKupon & { _idx: number }>
                  rowKey="_idx"
                  loading={loading}
                  search={false}
                  pagination={false}
                  dataSource={data.kp.map((k, _idx) => ({ ...k, _idx }))}
                  columns={[
                    { title: "Kod", dataIndex: "kod", copyable: true },
                    {
                      title: "Tutar",
                      dataIndex: "tutar",
                      width: 100,
                      render: (_, r) => (r.tutar ? `${r.tutar} TL` : "—"),
                    },
                    {
                      title: "%",
                      dataIndex: "yuzde",
                      width: 80,
                      render: (_, r) => (r.yuzde ? `%${r.yuzde}` : "—"),
                    },
                    {
                      title: "Durum",
                      dataIndex: "aktif",
                      width: 90,
                      render: (_, r) =>
                        r.aktif ? (
                          <Tag color="green">Aktif</Tag>
                        ) : (
                          <Tag>Pasif</Tag>
                        ),
                    },
                    {
                      title: "",
                      width: 80,
                      render: (_, r) => (
                        <Popconfirm
                          title="Kupon silinsin mi?"
                          onConfirm={async () => {
                            const res = await deleteEticaretItem("kupon", r._idx);
                            if (res.error) message.error(res.error);
                            else {
                              message.success("Silindi");
                              if (res.data) setData(res.data);
                              else load();
                            }
                          }}
                        >
                          <Button type="link" danger size="small">
                            Sil
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: "banner",
            label: `Banner (${data.b.length})`,
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={() => setBannerOpen(true)}>
                    Banner ekle
                  </Button>
                </Space>
                <ProTable<EticaretBanner & { _idx: number }>
                  rowKey="_idx"
                  loading={loading}
                  search={false}
                  pagination={false}
                  dataSource={data.b.map((b, _idx) => ({ ...b, _idx }))}
                  columns={[
                    {
                      title: "Konum",
                      dataIndex: "konum",
                      width: 130,
                      render: (_, r) =>
                        r.konum === "anasayfa_alt" ? "Alt şerit" : "Hero",
                    },
                    { title: "Başlık", dataIndex: "baslik", ellipsis: true },
                    {
                      title: "URL",
                      dataIndex: "url",
                      ellipsis: true,
                      copyable: true,
                    },
                    {
                      title: "",
                      width: 80,
                      render: (_, r) => (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={async () => {
                            const next = {
                              ...data,
                              b: data.b.filter((_, i) => i !== r._idx),
                            };
                            await persist(next);
                          }}
                        >
                          Sil
                        </Button>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <ModalForm<EticaretKampanya>
        title="Kampanya ekle"
        open={kampanyaOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setKampanyaOpen(false) }}
        onFinish={async (values) => {
          const active = !!values.active;
          const ok = await persist({
            ...data,
            k: [
              ...data.k,
              {
                ...values,
                acik: values.desc,
                active,
                aktif: active,
              },
            ],
          });
          if (ok) setKampanyaOpen(false);
          return ok;
        }}
      >
        <ProFormText name="ad" label="Ad" rules={[{ required: true }]} />
        <ProFormTextArea name="desc" label="Açıklama" />
        <ProFormText name="start" label="Başlangıç (YYYY-MM-DD)" />
        <ProFormText name="end" label="Bitiş (YYYY-MM-DD)" />
        <ProFormSwitch name="active" label="Aktif" initialValue />
      </ModalForm>

      <ModalForm<EticaretKupon>
        title="Kupon ekle"
        open={kuponOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setKuponOpen(false) }}
        onFinish={async (values) => {
          const tutar = Number(values.tutar) || 0;
          const yuzde = Number(values.yuzde) || 0;
          if (tutar <= 0 && yuzde <= 0) {
            message.error("Tutar veya yüzde girin");
            return false;
          }
          const ok = await persist({
            ...data,
            kp: [
              ...data.kp,
              {
                kod: values.kod,
                tutar: tutar || undefined,
                yuzde: yuzde || undefined,
                aktif: !!values.aktif,
              },
            ],
          });
          if (ok) setKuponOpen(false);
          return ok;
        }}
      >
        <ProFormText
          name="kod"
          label="Kupon kodu"
          rules={[{ required: true }]}
        />
        <ProFormText name="tutar" label="Sabit indirim (TL)" />
        <ProFormText name="yuzde" label="Yüzde indirim" />
        <ProFormSwitch name="aktif" label="Aktif" initialValue />
      </ModalForm>

      <ModalForm<EticaretBanner>
        title="Banner ekle"
        open={bannerOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setBannerOpen(false) }}
        onFinish={async (values) => {
          const ok = await persist({
            ...data,
            b: [
              ...data.b,
              {
                ...values,
                baslik: values.baslik || values.aciklama,
                aciklama: values.aciklama || values.baslik,
                konum: values.konum || "anasayfa_hero",
                aktif: values.aktif !== false,
              },
            ],
          });
          if (ok) setBannerOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="konum"
          label="Vitrin konumu"
          initialValue="anasayfa_hero"
          options={[
            { label: "Ana sayfa hero slider", value: "anasayfa_hero" },
            { label: "Ana sayfa alt şerit", value: "anasayfa_alt" },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="baslik" label="Başlık" rules={[{ required: true }]} />
        <ProFormText
          name="url"
          label="Link veya görsel URL"
          rules={[{ required: true }]}
        />
        <ProFormText name="image" label="Görsel URL (opsiyonel)" />
        <ProFormText name="icon" label="Alt metin / emoji (opsiyonel)" />
        <ProFormText name="aciklama" label="Açıklama (yönetim notu)" />
        <ProFormSwitch name="aktif" label="Vitrinde göster" initialValue />
      </ModalForm>
    </>
  );
}

function AlertCompat() {
  return (
    <ProCard style={{ marginBottom: 16 }}>
      <Typography.Paragraph style={{ marginBottom: 8 }}>
        Kampanya ticker, hero banner ve alt şerit{" "}
        <code>public/data/eticaret-icerik.json</code> dosyasına kaydedilir. Mağaza
        ana sayfası <code>/api/eticaret-icerik</code> üzerinden okur.
      </Typography.Paragraph>
      <Button href="/" target="_blank" size="small">
        Vitrini önizle →
      </Button>
    </ProCard>
  );
}
