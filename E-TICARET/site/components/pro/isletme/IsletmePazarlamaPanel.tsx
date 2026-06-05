"use client";

import { ProCard, ProTable } from "@ant-design/pro-components";
import { App, Button, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_ETICARET_ICERIK,
  fetchEticaretIcerik,
  type EticaretBanner,
  type EticaretKupon,
} from "@/lib/pro-admin-client";

type KuponRow = EticaretKupon & { ku?: number; lim?: number; tip?: string; ind?: number };

export default function IsletmePazarlamaPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [kuponlar, setKuponlar] = useState<KuponRow[]>([]);
  const [bannerlar, setBannerlar] = useState<(EticaretBanner & { ab_variant?: string })[]>([]);
  const [kampanyaSay, setKampanyaSay] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEticaretIcerik();
      if (res.error) message.warning(res.error);
      setKuponlar((res.data.kp || []) as KuponRow[]);
      setBannerlar((res.data.b || []) as (EticaretBanner & { ab_variant?: string })[]);
      setKampanyaSay(res.data.k.length);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const toplamKullanim = kuponlar.reduce((s, k) => s + (k.ku ?? 0), 0);

  return (
    <>
      <Typography.Paragraph type="secondary">
        Kupon doğrulama sepette <code>/api/kupon/dogrula</code> ile çalışır. Kampanya ve banner düzenleme için{" "}
        <a href="/yonetim/eticaret?tab=kampanya">E-ticaret → Kampanya</a> sekmesini kullanın.
      </Typography.Paragraph>

      <Space style={{ marginBottom: 16 }}>
        <Tag color="blue">{kampanyaSay} kampanya</Tag>
        <Tag color="green">{kuponlar.length} kupon</Tag>
        <Tag color="gold">{toplamKullanim} toplam kupon kullanımı</Tag>
        <Button onClick={load}>Yenile</Button>
      </Space>

      <ProCard title="Kupon raporu" loading={loading} style={{ marginBottom: 16 }}>
        <ProTable<KuponRow & { _idx: number }>
          rowKey="_idx"
          search={false}
          options={false}
          pagination={false}
          dataSource={kuponlar.map((k, _idx) => ({ ...k, _idx }))}
          columns={[
            { title: "Kod", dataIndex: "kod" },
            {
              title: "İndirim",
              render: (_, r) =>
                r.yuzde ? `%${r.yuzde}` : r.tutar ? `${r.tutar} ₺` : r.ind ? `${r.ind}` : "—",
            },
            {
              title: "Limit",
              render: (_, r) => (r.lim != null && r.lim > 0 ? r.lim : "∞"),
            },
            { title: "Kullanım", dataIndex: "ku", render: (v) => v ?? 0 },
            {
              title: "Durum",
              dataIndex: "aktif",
              render: (v) => (v !== false ? <Tag color="success">Aktif</Tag> : <Tag>Pasif</Tag>),
            },
          ]}
        />
      </ProCard>

      <ProCard title="Banner A/B varyantları" loading={loading}>
        <ProTable
          rowKey={(r, i) => String(i)}
          search={false}
          options={false}
          pagination={false}
          dataSource={bannerlar}
          columns={[
            { title: "Konum", dataIndex: "konum" },
            { title: "Başlık", dataIndex: "baslik", ellipsis: true },
            {
              title: "Varyant",
              dataIndex: "ab_variant",
              render: (v) => <Tag color={v === "B" ? "purple" : "cyan"}>{v || "A"}</Tag>,
            },
            {
              title: "Aktif",
              dataIndex: "aktif",
              render: (v) => (v !== false ? "Evet" : "Hayır"),
            },
          ]}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          Banner&apos;a <code>ab_variant: &quot;A&quot;</code> veya <code>&quot;B&quot;</code> ekleyerek vitrin A/B
          testi yapabilirsiniz (Kampanya sekmesinden JSON alanı veya ileride form alanı).
        </Typography.Paragraph>
      </ProCard>
    </>
  );
}
