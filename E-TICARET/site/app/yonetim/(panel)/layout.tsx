import { ProProvider } from "@/components/pro/pro-provider";
import { ProShell } from "@/components/pro/pro-shell";
import "antd/dist/reset.css";

export default function YonetimPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProProvider>
      <ProShell>{children}</ProShell>
    </ProProvider>
  );
}
