import type { Metadata } from "next";
import BesosScripts from "@/components/besos/BesosScripts";
import BesosDrawerShell from "@/components/besos/BesosDrawerShell";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import "./besos.css";

export const metadata: Metadata = {
  title: "Besos · Bar Design Studio",
  description:
    "Bar Design Studio — Manhattan, Boulverdier, Clover ve 42 modüllük bar katalog. Bar servisinin sanatını yükseltiyoruz.",
};

export default function BesosLayout({ children }: { children: React.ReactNode }) {
  const heroEmbed = "https://www.youtube-nocookie.com";
  return (
    <>
      <link rel="preconnect" href={heroEmbed} />
      <link rel="preconnect" href="https://www.youtube.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/theme.css?v=${SHOP_ASSET_V}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/besos-shell.css?v=${SHOP_ASSET_V}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/contact.css?v=${SHOP_ASSET_V}`} />
      {children}
      <BesosDrawerShell />
      <BesosScripts />
    </>
  );
}
