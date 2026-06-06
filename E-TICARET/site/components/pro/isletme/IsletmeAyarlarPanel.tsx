"use client";

import {
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { App, Button, Col, Form, Row, Space, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  fetchEticaretIcerik,
  magazaAyarlariFromEticaret,
  type MagazaAyarlari,
  saveEticaretIcerik,
} from "@/lib/pro-admin-client";

export default function IsletmeAyarlarPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<MagazaAyarlari & { i18n_tr: string; kargo_bolgeleri_text: string }>();
  const [i18nLocale, setI18nLocale] = useState<"tr" | "en">("tr");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEticaretIcerik();
      const a = magazaAyarlariFromEticaret(res.data.a);
      const overrides = a.i18n_overrides[i18nLocale] || {};
      form.setFieldsValue({
        ...a,
        kargo_bolgeleri_text: a.kargo_bolgeleri.join("\n"),
        i18n_tr: Object.entries(overrides)
          .map(([k, v]) => `${k}=${v}`)
          .join("\n"),
      });
    } finally {
      setLoading(false);
    }
  }, [form, i18nLocale]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(values: MagazaAyarlari & { i18n_tr: string; kargo_bolgeleri_text: string }) {
    const res = await fetchEticaretIcerik();
    const prev = magazaAyarlariFromEticaret(res.data.a);

    const i18nLines = String(values.i18n_tr || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const localeOverrides: Record<string, string> = {};
    for (const line of i18nLines) {
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      localeOverrides[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }

    const kargoBolgeleri = String(values.kargo_bolgeleri_text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const nextA = {
      ...res.data.a,
      whatsapp_e164: values.whatsapp_e164,
      whatsapp_prefill: values.whatsapp_prefill,
      ucretsiz_kargo: values.ucretsiz_kargo,
      ucretsiz_kargo_limit_tl: values.ucretsiz_kargo_limit_tl,
      kargo_bolgeleri: kargoBolgeleri.length ? kargoBolgeleri : ["Türkiye geneli"],
      kdv_gosterim: values.kdv_gosterim,
      kdv_oran: values.kdv_oran,
      i18n_overrides: {
        ...prev.i18n_overrides,
        [i18nLocale]: localeOverrides,
      },
    };

    const save = await saveEticaretIcerik({ ...res.data, a: nextA });
    if (save.error) {
      message.error(save.error);
      return;
    }
    message.success("Ayarlar kaydedildi — vitrin birkaç saniye içinde güncellenir");
  }

  return (
    <>
      <Typography.Paragraph type="secondary">
        WhatsApp, kargo metni, KDV gösterimi ve çeviri override&apos;ları tek yerden yönetilir (
        <code>eticaret-icerik.json → a</code>).
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={onSave} disabled={loading}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <ProFormText
              name="whatsapp_e164"
              label="WhatsApp (E.164)"
              placeholder="905326840152"
              rules={[{ required: true }]}
            />
            <ProFormTextArea name="whatsapp_prefill" label="WhatsApp ön metin" fieldProps={{ rows: 2 }} />
          </Col>
          <Col xs={24} md={12}>
            <ProFormSwitch name="ucretsiz_kargo" label="Ücretsiz kargo aktif" />
            <ProFormDigit
              name="ucretsiz_kargo_limit_tl"
              label="Ücretsiz kargo alt limit (₺, 0 = sınırsız)"
              min={0}
            />
            <ProFormTextArea
              name="kargo_bolgeleri_text"
              label="Kargo bölgeleri (satır başına)"
              fieldProps={{ rows: 3 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <ProFormSelect
              name="kdv_gosterim"
              label="Fiyat gösterimi"
              options={[
                { value: "dahil", label: "KDV dahil" },
                { value: "haric", label: "KDV hariç + not" },
              ]}
            />
            <ProFormDigit name="kdv_oran" label="KDV oranı (%)" min={0} max={100} />
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ marginBottom: 8 }}>
              <Typography.Text strong>Çeviri override</Typography.Text>
              <Button
                size="small"
                type={i18nLocale === "tr" ? "primary" : "default"}
                onClick={() => setI18nLocale("tr")}
              >
                TR
              </Button>
              <Button
                size="small"
                type={i18nLocale === "en" ? "primary" : "default"}
                onClick={() => setI18nLocale("en")}
              >
                EN
              </Button>
            </Space>
            <ProFormTextArea
              name="i18n_tr"
              label={`${i18nLocale.toUpperCase()} — anahtar=metin (satır başına)`}
              placeholder="cart.lead=Yeni metin"
              fieldProps={{ rows: 8, style: { fontFamily: "monospace" } }}
            />
          </Col>
        </Row>
        <Button type="primary" htmlType="submit">
          Kaydet
        </Button>
      </Form>
    </>
  );
}
