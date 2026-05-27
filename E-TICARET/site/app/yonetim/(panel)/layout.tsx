import { ProShell } from "@/components/pro/pro-shell";

export default function YonetimPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProShell>{children}</ProShell>;
}
