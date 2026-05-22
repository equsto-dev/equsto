"use client";

import { LockOutlined } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { App, Card, Typography } from "antd";
import { useRouter } from "next/navigation";
import { probeAdminToken, setProToken } from "@/lib/pro-admin-client";

export default function YonetimGirisPage() {
  const router = useRouter();
  const { message } = App.useApp();

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
        <LoginForm
          onFinish={async (values) => {
            const token = String(values.token || "").trim();
            if (!token) {
              message.error("Token girin");
              return;
            }
            const probe = await probeAdminToken(token);
            if (!probe.ok) {
              message.error(
                probe.error ||
                  "Token reddedildi. Vercel → EQUSTO_ADMIN_BEARER değerini kopyalayın (Eq_… müşteri kodu değil).",
              );
              return;
            }
            setProToken(token);
            message.success("Giriş kaydedildi");
            router.replace("/yonetim/kontrol");
          }}
          submitter={{ searchConfig: { submitText: "Panele gir" } }}
        >
          <ProFormText.Password
            name="token"
            fieldProps={{
              size: "large",
              prefix: <LockOutlined />,
              autoComplete: "current-password",
            }}
            placeholder="EQUSTO_ADMIN_BEARER (ör. equsto2025)"
            rules={[{ required: true, message: "Token zorunlu" }]}
          />
        </LoginForm>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          Sadece değeri yapıştırın — <strong>tırnak işareti olmadan</strong> (ör.{" "}
          <code>eq_adm_5431432608_eq_adm_5431432608</code>,{" "}
          <code>&quot;…&quot;</code> değil). Vercel <code>EQUSTO_ADMIN_BEARER</code> ile
          aynı olmalı.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
