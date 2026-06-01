"use client";

import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PfosDropZone from "@/components/pfos/pro/PfosDropZone";
import {
  analyzeImportFile,
  fetchTipSozlugu,
  getProToken,
  saveImportItems,
  type ImportAnalizItem,
  type TipSozlukEntry,
} from "@/lib/pro-admin-client";

const KATEGORILER = [
  "pisirme",
  "sogutma",
  "icecek",
  "yikama",
  "hazirlik",
  "tezgah_davlumbaz",
  "depolama",
  "araba",
  "yardimci",
  "sunum",
  "diger",
];

type ImportRow = ImportAnalizItem & {
  key: number;
  onaylandi: boolean;
};

function buildImportUserPrompt(notes: string): string {
  const trimmed = notes.trim();
  if (!trimmed) return "Dosyayı analiz et:";
  return `Dosyayı analiz et.

Yükleyenin liste notları (bağlam — dosyada olmayan bilgileri buradan kullan):
---
${trimmed}
---`;
}

function fileKind(file: File): "pdf" | "excel" | null {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls") return "excel";
  return null;
}

export default function PfosImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "excel" | null>(null);
  const [tipSozlugu, setTipSozlugu] = useState<TipSozlukEntry[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseStep, setParseStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importNotes, setImportNotes] = useState("");

  useEffect(() => {
    fetchTipSozlugu().then(({ entries }) => setTipSozlugu(entries));
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileB64(null);
    setFileType(null);
    setRows([]);
    setError(null);
    setParseStep("");
    setImportNotes("");
  }, []);

  const loadFile = useCallback((f: File) => {
    const kind = fileKind(f);
    if (!kind) {
      message.error("Sadece PDF, XLSX veya XLS desteklenir.");
      return;
    }
    setFile(f);
    setFileType(kind);
    setRows([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || "");
      const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      setFileB64(b64 || null);
    };
    reader.readAsDataURL(f);
  }, []);

  const startParse = async () => {
    if (!fileB64 || !fileType) return;
    setParsing(true);
    setError(null);
    setRows([]);

    const steps = [
      "Dosya okunuyor…",
      "Ekipman kalemleri tanımlanıyor…",
      "tip_sozlugu ile eşleştiriliyor…",
      "Sonuçlar hazırlanıyor…",
    ];
    let si = 0;
    setParseStep(steps[0]);
    const timer = window.setInterval(() => {
      si = (si + 1) % steps.length;
      setParseStep(steps[si]);
    }, 1800);

    const tipListesi = tipSozlugu
      .map((t) => `${t.tip_kodu} → ${t.aciklama} (${t.kategori})`)
      .join("\n");

    const systemPrompt = `Sen bir endüstriyel mutfak ekipmanı uzmanısın.
Kullanıcı sana bir ${fileType === "pdf" ? "PDF" : "Excel"} dosyası yükleyecek.
Bu dosyadan ekipman kalemlerini çıkar ve aşağıdaki tip_sozlugu ile eşleştir.

TİP SÖZLÜĞÜ (mevcut):
${tipListesi}

GÖREV:
1. Dosyadaki her ekipman kalemini tespit et
2. Mevcut tip_sozlugu'ndan en uygun tip_kodu'nu bul
3. Uygun yoksa yeni bir tip_kodu öner (snake_case, Türkçe karaktersiz)
4. Her kalem için kategori belirle: pisirme / icecek / sogutma / yikama / hazirlik / diger

SADECE JSON döndür, başka hiçbir şey yazma:
[
  {
    "ham_isim": "dosyadan gelen orijinal metin",
    "tip_kodu": "mevcut_veya_yeni_kod",
    "aciklama": "Türkçe açıklama",
    "kategori": "kategori_adi",
    "durum": "eslesti" | "yeni" | "belirsiz",
    "eslesen_tip": "eşleşen mevcut tip_kodu veya null"
  }
]`;

    const { data, error: err } = await analyzeImportFile({
      dosya_base64: fileB64,
      dosya_tip:
        fileType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      system_prompt: systemPrompt,
      user_prompt: buildImportUserPrompt(importNotes),
    });

    window.clearInterval(timer);
    setParsing(false);
    setParseStep("");

    if (err || !data) {
      setError(err || "Analiz başarısız");
      return;
    }

    setRows(
      data.map((item, i) => ({
        ...item,
        key: i,
        durum: item.sozlukte_var ? "eslesti" : item.durum || "yeni",
        onaylandi: item.durum !== "belirsiz",
      })),
    );
  };

  const saveApproved = async () => {
    const ekipmanlar = rows
      .filter((r) => r.onaylandi && r.tip_kodu?.trim())
      .map((r) => ({
        tip_kodu: r.tip_kodu.trim(),
        ham_isim: r.ham_isim || r.tip_kodu,
        kategori: r.kategori || "diger",
      }));

    if (!ekipmanlar.length) {
      message.warning("Kaydedilecek onaylı satır yok.");
      return;
    }

    setSaving(true);
    const res = await saveImportItems(ekipmanlar);
    setSaving(false);

    if (res.error) {
      message.error(res.error);
      return;
    }
    message.success(
      `${res.eklendi ?? 0} yeni tip, ${res.guncellendi ?? 0} güncellendi`,
    );
  };

  const eslesen = rows.filter((r) => r.durum === "eslesti").length;
  const yeni = rows.filter((r) => r.durum === "yeni").length;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {!getProToken() && (
        <Alert
          type="warning"
          showIcon
          message="Bearer token gerekli"
          description={
            <span>
              Analiz ve kayıt için{" "}
              <Link href="/yonetim/giris">yönetim girişi</Link> yapın veya{" "}
              <code>EQUSTO_ADMIN_BEARER</code> değerini yapıştırın.
            </span>
          }
        />
      )}

      <ProCard title="PDF / Excel import" bordered>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Teklif listesi, proforma veya proje ekipman listesini sürükleyin.
          Claude API proxy (<code>npm run api</code>, port 3001) çalışıyor olmalı.
        </Typography.Paragraph>

        <Row gutter={16} align="stretch">
          <Col xs={24} lg={12}>
            <PfosDropZone
              compact
              accept=".pdf,.xlsx,.xls"
              title="PDF veya Excel dosyasını sürükle ya da tıkla"
              hint="Teklif listesi · proforma · ekipman listesi"
              fileName={file?.name}
              fileMeta={
                file
                  ? `${(file.size / 1024).toFixed(1)} KB · ${fileType?.toUpperCase()}`
                  : null
              }
              disabled={parsing}
              onFile={loadFile}
              onClear={reset}
            />
          </Col>
          <Col xs={24} lg={12}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 220,
              }}
            >
              <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                Liste notları
              </Typography.Text>
              <Typography.Paragraph
                type="secondary"
                style={{ marginTop: 0, marginBottom: 8, fontSize: 12 }}
              >
                Proje adı, mutfak tipi, özel istekler — analiz sırasında Claude bu metni
                okur.
              </Typography.Paragraph>
              <Input.TextArea
                value={importNotes}
                onChange={(e) => setImportNotes(e.target.value)}
                disabled={parsing}
                placeholder="Örn: Steakhouse 250 m², H yıkama ayrı bölüm, Öztiryakiler ağırlıklı teklif…"
                style={{
                  flex: 1,
                  minHeight: 160,
                  resize: "vertical",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
                maxLength={8000}
                showCount
              />
            </div>
          </Col>
        </Row>

        <Space style={{ marginTop: 16 }} wrap>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            disabled={!fileB64 || parsing}
            loading={parsing}
            onClick={startParse}
          >
            Analiz et
          </Button>
          {file && (
            <Button onClick={reset} disabled={parsing}>
              Temizle
            </Button>
          )}
        </Space>

        {parsing && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={99} status="active" showInfo={false} />
            <Typography.Text type="secondary">{parseStep}</Typography.Text>
          </div>
        )}

        {error && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            message="Analiz hatası"
            description={
              <Space direction="vertical" size={4}>
                <span>{error}</span>
                {error.includes("502") || /ulaşılamad|proxy|3001/i.test(error) ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Yerelde: <code>npm run api</code> veya <code>npm run dev:all</code>
                  </Typography.Text>
                ) : null}
              </Space>
            }
          />
        )}
      </ProCard>

      {rows.length > 0 && (
        <ProCard
          title="Import sonuçları"
          bordered
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={saveApproved}
            >
              Sözlüğe kaydet
            </Button>
          }
        >
          <Space size="large" style={{ marginBottom: 16 }}>
            <Statistic title="Toplam" value={rows.length} />
            <Statistic title="Eşleşen" value={eslesen} valueStyle={{ color: "#52c41a" }} />
            <Statistic title="Yeni tip" value={yeni} valueStyle={{ color: "#1677ff" }} />
          </Space>

          <Table<ImportRow>
            size="small"
            pagination={{ pageSize: 15 }}
            dataSource={rows}
            scroll={{ x: 900 }}
            columns={[
              {
                title: "",
                width: 44,
                render: (_, r) => (
                  <Checkbox
                    checked={r.onaylandi}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.key === r.key ? { ...x, onaylandi: e.target.checked } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                title: "Ham isim",
                dataIndex: "ham_isim",
                ellipsis: true,
              },
              {
                title: "tip_kodu",
                width: 180,
                render: (_, r) => (
                  <Input
                    size="small"
                    value={r.tip_kodu}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.key === r.key ? { ...x, tip_kodu: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                title: "Kategori",
                width: 160,
                render: (_, r) => (
                  <Select
                    size="small"
                    style={{ width: "100%" }}
                    value={r.kategori || "diger"}
                    options={KATEGORILER.map((c) => ({ value: c, label: c }))}
                    onChange={(v) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.key === r.key ? { ...x, kategori: v } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                title: "Durum",
                width: 110,
                render: (_, r) => {
                  if (r.durum === "eslesti")
                    return (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Eşleşti
                      </Tag>
                    );
                  if (r.durum === "yeni") return <Tag color="processing">Yeni</Tag>;
                  return <Tag color="warning">Belirsiz</Tag>;
                },
              },
            ]}
          />
        </ProCard>
      )}
    </Space>
  );
}
