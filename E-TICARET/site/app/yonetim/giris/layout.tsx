import { ProProvider } from "@/components/pro/pro-provider";
import "antd/dist/reset.css";

export default function YonetimGirisLayout({ children }: { children: React.ReactNode }) {
  return <ProProvider>{children}</ProProvider>;
}
