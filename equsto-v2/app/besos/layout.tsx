import type { Metadata } from "next";
import BesosScripts from "@/components/besos/BesosScripts";
import "./besos.css";

export const metadata: Metadata = {
  title: "Besos · Equsto Bar Studio",
  description:
    "Equsto Bar Studio — Manhattan, Boulverdier, Clover ve 42 modüllük bar katalog. Bar servisinin sanatını yükseltiyoruz.",
};

export default function BesosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/theme.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/eq-youtube-embed.css" />
      {children}
      <BesosScripts />
    </>
  );
}
