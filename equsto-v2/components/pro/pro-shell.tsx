"use client";

import {
  DashboardOutlined,
  SearchOutlined,
  ShopOutlined,
  DatabaseOutlined,
  LinkOutlined,
  LogoutOutlined,
  ProjectOutlined,
  CloudUploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-layout";
import { Dropdown } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearProToken, getProToken } from "@/lib/pro-admin-client";

const menuRoutes = [
  { path: "/yonetim/kontrol", name: "Kontrol", icon: <DashboardOutlined /> },
  { path: "/yonetim/katalog", name: "Katalog & görseller", icon: <PictureOutlined /> },
  { path: "/yonetim/pfos", name: "PFOS", icon: <ProjectOutlined /> },
  { path: "/yonetim/yayin", name: "Yayınlama", icon: <CloudUploadOutlined /> },
  { path: "/yonetim/ozet", name: "Özet", icon: <DashboardOutlined /> },
  { path: "/yonetim/urunler", name: "API ürünler", icon: <ShopOutlined /> },
  { path: "/yonetim/arama", name: "Arama", icon: <SearchOutlined /> },
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
        <Link href="/yonetim/kontrol" style={{ color: "#fff", fontWeight: 700 }}>
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
        if (!item.path || item.path === pathname) return dom;
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
  catalog: <DatabaseOutlined />,
  search: <SearchOutlined />,
};
