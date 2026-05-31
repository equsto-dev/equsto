"use client";

import {
  DashboardOutlined,
  LinkOutlined,
  LogoutOutlined,
  ProjectOutlined,
  ShopOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-layout";
import { Dropdown } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearProToken, getProToken } from "@/lib/pro-admin-client";

const menuRoutes = [
  { path: "/yonetim", name: "Ana sayfa", icon: <DashboardOutlined /> },
  { path: "/yonetim/eticaret", name: "E-ticaret", icon: <ShopOutlined /> },
  { path: "/yonetim/pfos", name: "PFOS", icon: <ProjectOutlined /> },
  { path: "/yonetim/kontrol", name: "Kontrol", icon: <ToolOutlined /> },
];

export function ProShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getProToken()) {
      router.replace("/yonetim/giris");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <ProLayout
      title="Equsto Yönetim"
      logo={
        <Link href="/yonetim" style={{ color: "#fff", fontWeight: 700 }}>
          EQUSTO
        </Link>
      }
      layout="mix"
      fixSiderbar
      location={{ pathname }}
      route={{
        path: "/yonetim",
        routes: menuRoutes.map((r) => ({
          path: r.path,
          name: r.name,
          icon: r.icon,
        })),
      }}
      menuItemRender={(item, dom) => {
        if (!item.path) return dom;
        const active =
          item.path === "/yonetim"
            ? pathname === "/yonetim"
            : pathname === item.path || pathname.startsWith(`${item.path}/`);
        if (active) return dom;
        return <Link href={item.path}>{dom}</Link>;
      }}
      avatarProps={{
        title: "Admin",
        render: (_, dom) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "site",
                  icon: <LinkOutlined />,
                  label: (
                    <a href="/" target="_blank" rel="noreferrer">
                      Mağazayı aç
                    </a>
                  ),
                },
                {
                  key: "legacy",
                  icon: <LinkOutlined />,
                  label: (
                    <a href="/admin.html" target="_blank" rel="noreferrer">
                      Eski admin (HTML)
                    </a>
                  ),
                },
                { type: "divider" },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Çıkış",
                  onClick: () => {
                    clearProToken();
                    router.replace("/yonetim/giris");
                  },
                },
              ],
            }}
          >
            {dom}
          </Dropdown>
        ),
      }}
      menuFooterRender={() => (
        <div style={{ padding: "8px 16px", fontSize: 12, color: "rgba(0,0,0,.45)" }}>
          Equsto Pro · Ant Design
        </div>
      )}
    >
      {children}
    </ProLayout>
  );
}

export const proMenuIcons = {
  dashboard: <DashboardOutlined />,
  products: <ShopOutlined />,
  eticaret: <ShopOutlined />,
  pfos: <ProjectOutlined />,
};
