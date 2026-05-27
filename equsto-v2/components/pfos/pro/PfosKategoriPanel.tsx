"use client";

import {
  CloudUploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  deletePfosKategoriListe,
  fetchPfosKategoriler,
  uploadPfosKategoriListe,
  type PfosKategorilerManifest,
} from "@/lib/pro-admin-client";

type BantRow = {
  key: string;
  kategoriId: string;
  kategoriLabel: string;
  ustKategori: string;
  bantId: string;
  bantLabel: string;
  referansM2: number;
  kalemSayisi: number;
  toplamAdet: number;
  kaynakDosya?: string;
  yukleme?: string;
};

function flattenManifest(m: PfosKategorilerManifest): BantRow[] {
  const out: BantRow[] = [];
  for (const k of m.kategoriler) {
    for (const b of k.bantlar) {
      out.push({
        key: `${k.id}:${b.id}`,
        kategoriId: k.id,
        kategoriLabel: k.label,
        ustKategori: k.ustKategori,
        bantId: b.id,
        bantLabel: b.label,
        referansM2: b.referansM2,
        kalemSayisi: b.meta?.kalemSayisi ?? 0,
        toplamAdet: b.meta?.toplamAdet ?? 0,
        kaynakDosya: b.meta?.kaynakDosya,
        yukleme: b.meta?.yukleme,
      });
    }
  }
  return out;
}

export default function PfosKategoriPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<PfosKategorilerManifest | null>(
    null,
  );
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { manifest: m, error: err } = await fetchPfosKategoriler();
    if (err) setError(err);
    else setManifest(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const makeUploadProps = (row: BantRow): UploadProps => ({
    accept: ".xlsx",
    showUploadList: false,
    maxCount: 1,
    beforeUpload: (file) => {
      setUploadingKey(row.key);
      uploadPfosKategoriListe(row.kategoriId, row.bantId, file)
        .then((res) => {
          if (res.error) {
            message.error(res.error);
            return;
          }
          message.success(
            `${row.kategoriLabel} ${row.bantLabel}: ${res.kalemSayisi ?? 0} kalem yüklendi`,
          );
          if (res.manifest) setManifest(res.manifest);
          else load();
        })
        .finally(() => setUploadingKey(null));
      return false;
    },
  });

  const rows = manifest ? flattenManifest(manifest) : [];

  return (
    <ProCard
      title="Kategoriler — m² bantlı ekipman listeleri"
      extra={
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Yenile
        </Button>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Steakhouse ve Balıkçı için <strong>80–150</strong> ve <strong>150–250 m²</strong>{" "}
        referans listelerini Excel olarak yükleyin. Dosyalar{" "}
        <Typography.Text code>public/data/pfos-referans/</Typography.Text> altına
        kaydedilir; PFOS matrisindeki plan↔liste eşleşmesiyle aynı bantlar.
      </Typography.Paragraph>

      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      )}

      <Table<BantRow>
        loading={loading}
        dataSource={rows}
        pagination={false}
        size="middle"
        columns={[
          {
            title: "Kategori",
            render: (_, r) => (
              <Space direction="vertical" size={0}>
                <strong>{r.kategoriLabel}</strong>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {r.ustKategori}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "m² bantı",
            dataIndex: "bantLabel",
            render: (t, r) => (
              <Space>
                <Tag>{t}</Tag>
                <Typography.Text type="secondary">
                  ref {r.referansM2} m²
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: "Liste",
            render: (_, r) =>
              r.kalemSayisi > 0 ? (
                <Space direction="vertical" size={0}>
                  <span>
                    {r.kalemSayisi} kalem · {r.toplamAdet} adet
                  </span>
                  {r.kaynakDosya && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {r.kaynakDosya}
                    </Typography.Text>
                  )}
                  {r.yukleme && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(r.yukleme).toLocaleString("tr-TR")}
                    </Typography.Text>
                  )}
                </Space>
              ) : (
                <Typography.Text type="warning">Henüz yüklenmedi</Typography.Text>
              ),
          },
          {
            title: "İşlem",
            width: 220,
            render: (_, r) => (
              <Space wrap>
                <Upload {...makeUploadProps(r)}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CloudUploadOutlined />}
                    loading={uploadingKey === r.key}
                  >
                    Excel yükle
                  </Button>
                </Upload>
                {r.kalemSayisi > 0 && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      if (
                        !confirm(
                          `${r.kategoriLabel} ${r.bantLabel} listesini silmek istiyor musunuz?`,
                        )
                      )
                        return;
                      deletePfosKategoriListe(r.kategoriId, r.bantId).then(
                        (res) => {
                          if (res.error) message.error(res.error);
                          else {
                            message.info("Liste kaldırıldı");
                            if (res.manifest) setManifest(res.manifest);
                            else load();
                          }
                        },
                      );
                    }}
                  >
                    Sil
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="Excel formatı"
        description={
          <>
            Sütunlar: <strong>Bölüm başlığı</strong> (A- DEPO) veya{" "}
            <strong>Poz | Ürün | Ölçü | Adet</strong> (Balıkçı: Böl. | Poz | …).
            Kaynak örnek: PFOS <code>veri/proje-veri/STEAKHOUSE</code> ve{" "}
            <code>BALIKCI</code> klasörleri.
          </>
        }
      />
    </ProCard>
  );
}
