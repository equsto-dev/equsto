"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import trTR from "antd/locale/tr_TR";
import type { ReactNode } from "react";

export function ProProvider({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={trTR}
        theme={{
          token: {
            colorPrimary: "#1463ff",
            borderRadius: 6,
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
