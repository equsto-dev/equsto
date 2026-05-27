import "antd/dist/reset.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import trTR from "antd/locale/tr_TR";
import Script from "next/script";
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
        <Script id="eq-pfos-body-boot" strategy="beforeInteractive">{`
(function(){try{
  document.documentElement.classList.add("eq-pfos-boot");
  function apply(){document.body&&document.body.classList.add("eq-shop","eq-pfos-public");}
  if(document.body)apply();
  else document.addEventListener("DOMContentLoaded",apply,{once:true});
}catch(e){}})();
        `}</Script>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/theme.css?v=20260530logo" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/eq-pfos-public-chrome.css?v=20260524pfoshdr" />
        <PfosScripts />
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
