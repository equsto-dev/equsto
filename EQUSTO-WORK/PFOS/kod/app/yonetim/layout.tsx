import type { Metadata } from "next";
import { ProProvider } from "@/components/pro/pro-provider";
import "antd/dist/reset.css";

export const metadata: Metadata = {
  title: "Equsto Yönetim",
  description: "Ant Design Pro yönetim paneli",
};

export default function YonetimRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <ProProvider>{children}</ProProvider>
    </div>
  );
}
