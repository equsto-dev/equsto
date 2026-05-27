import "antd/dist/reset.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import trTR from "antd/locale/tr_TR";
import PfosScripts from "@/components/pfos/public/PfosScripts";

export default function PfosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={trTR}
        theme={{
          token: {
            colorPrimary: "#001e50",
            borderRadius: 8,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          },
        }}
      >
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/theme.css" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/eq-pfos-public-chrome.css" />
        <PfosScripts />
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
