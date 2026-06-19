"use client";

import { CopyOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import { Alert, Button, Space, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import PfosDropZone from "@/components/pfos/pro/PfosDropZone";
import {
  fetchProjeAkis,
  fetchTipSozlugu,
  type ProjeAkisData,
  type TipSozlukEntry,
} from "@/lib/pro-admin-client";

function buildExportConfig(
  data: ProjeAkisData,
  tipSozlugu: TipSozlukEntry[],
) {
  return {
    version: "1.1",
    generated: new Date().toISOString().slice(0, 10),
    tip_sozlugu: tipSozlugu.map((t) => ({
      tip_kodu: t.tip_kodu,
      aciklama: t.aciklama,
      kategori: t.kategori,
      kaynak: t.kaynak,
    })),
    proje_fabrikasi: {
      sorular: data.questions ?? [],
    },
    konsept_tipleri: data.shopTypes ?? [],
    kurallar: data.rules ?? [],
    ekipman_setleri: data.eqSets ?? [],
    urun_katalogu: data.products ?? [],
    updated_at: data.updated_at ?? null,
  };
}

export default function PfosExportPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjeAkisData | null>(null);
  const [tipSozlugu, setTipSozlugu] = useState<TipSozlukEntry[]>([]);
  const [importedJson, setImportedJson] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [akis, tips] = await Promise.all([
      fetchProjeAkis(),
      fetchTipSozlugu(),
    ]);
    if (akis.error && !akis.data?.questions?.length) setError(akis.error);
    setData(akis.data);
    setTipSozlugu(tips.entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportJson = useMemo(() => {
    if (importedJson) return importedJson;
    if (!data) return "{}";
    return JSON.stringify(buildExportConfig(data, tipSozlugu), null, 2);
  }, [data, tipSozlugu, importedJson]);

  const fileName = `equsto-pfos-config-${new Date().toISOString().slice(0, 10)}.json`;

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      message.success("JSON panoya kopyalandı");
    } catch {
      message.error("Kopyalanamadı");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    message.success("İndirildi");
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      try {
        JSON.parse(text);
        setImportedJson(text);
        message.success(`${file.name} önizlemeye yüklendi`);
      } catch {
        message.error("Geçerli JSON değil");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <ProCard
        title="JSON dışa aktar"
        bordered
        loading={loading}
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Yenile
          </Button>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Proje akışı, kurallar, setler ve tip sözlüğünü tek JSON dosyasında
          dışa aktarın. admin.html &quot;Export&quot; sekmesiyle aynı yapı.
        </Typography.Paragraph>

        {error && (
          <Alert type="warning" showIcon message={error} style={{ marginBottom: 16 }} />
        )}

        <Space wrap style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<CopyOutlined />} onClick={copyJson}>
            Kopyala
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadJson}>
            JSON indir
          </Button>
          {importedJson && (
            <Button onClick={() => setImportedJson(null)}>Canlı veriye dön</Button>
          )}
        </Space>

        <pre
          style={{
            margin: 0,
            maxHeight: 480,
            overflow: "auto",
            padding: 16,
            background: "#0d1117",
            color: "#e6edf3",
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {exportJson}
        </pre>
      </ProCard>

      <ProCard title="JSON içe aktar (önizleme)" bordered>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Dışarıdan bir config dosyasını sürükleyerek önizleyin. Canlı veriyi
          değiştirmez — yalnızca export alanında gösterir.
        </Typography.Paragraph>
        <PfosDropZone
          accept=".json,application/json"
          title="JSON config dosyasını sürükle ya da tıkla"
          hint="equsto-decision-config-*.json"
          onFile={handleImportFile}
          onClear={() => setImportedJson(null)}
          fileName={importedJson ? "Özel JSON önizlemesi" : undefined}
        />
      </ProCard>
    </Space>
  );
}
