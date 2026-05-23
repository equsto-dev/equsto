"use client";

import { KeyOutlined } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { App, Card, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchBearerHint,
  normalizeProToken,
  probeAdminToken,
  setProToken,
} from "@/lib/pro-admin-client";

export default function YonetimGirisPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [tokenLen, setTokenLen] = useState(0);
  const [serverHint, setServerHint] = useState<string | null>(null);

  useEffect(() => {
    fetchBearerHint().then((h) => {
      if (h.error) {
        setServerHint(h.error);
        return;
      }
      if (h.length) {
        setServerHint(
          `Canlı sunucu: ${h.length} karakter, «${h.prefix || "…"}» ile başlamalı. Vercel göz ikonundan kopyalayın.`,
        );
      }
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)",
        padding: 24,
      }}
    >
      <Card style={{ width: 400, maxWidth: "100%" }} bordered={false}>
        <Typography.Title level={3} style={{ textAlign: "center", marginTop: 0 }}>
          Equsto Yönetim
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: "center" }}>
          Ant Design Pro — API Bearer token
        </Typography.Paragraph>
        {serverHint && (
          <Typography.Paragraph
            type="secondary"
            style={{ fontSize: 12, textAlign: "center", marginBottom: 12 }}
          >
            {serverHint}
          </Typography.Paragraph>
        )}
        <LoginForm
          onFinish={async (values) => {
            const token = normalizeProToken(String(values.token || ""));
            if (!token) {
              message.error("Token girin");
              return;
            }
            const probe = await probeAdminToken(token);
            if (!probe.ok) {
              message.error(probe.error || "Token reddedildi", 8);
              return;
            }
            setProToken(token);
            message.success("Giriş kaydedildi");
            router.replace("/yonetim/kontrol");
          }}
          submitter={{ searchConfig: { submitText: "Panele gir" } }}
        >
          <ProFormText
            name="token"
            fieldProps={{
              size: "large",
              prefix: <KeyOutlined />,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "off",
              spellCheck: false,
              onChange: (e) => {
                setTokenLen(normalizeProToken(e.target.value).length);
              },
            }}
            placeholder="Vercel EQUSTO_ADMIN_BEARER değerini yapıştırın"
            rules={[{ required: true, message: "Token zorunlu" }]}
          />
        </LoginForm>
        <Typography.Paragraph
          type={tokenLen > 0 ? "secondary" : "warning"}
          style={{ fontSize: 12, marginBottom: 8 }}
        >
          Yapıştırılan token: <strong>{tokenLen}</strong> karakter
          {tokenLen > 0 && tokenLen < 20
            ? " — çok kısa; tarayıcı eski şifre doldurmuş olabilir, alanı temizleyip Vercel’den tekrar yapıştırın."
            : ""}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          Vercel → <code>EQUSTO_ADMIN_BEARER</code> → göz ikonu → kopyala → buraya yapıştır.
          Tırnak yok. Giriş ve Vercel <strong>aynı uzunlukta</strong> olmalı.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
