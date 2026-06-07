import type { Metadata } from "next";
import MemberAccountHub from "@/components/account/MemberAccountHub";
import VitrinShell from "@/components/vitrin/VitrinShell";

export const metadata: Metadata = {
  title: "Hesabım · Equsto",
  description:
    "Equsto üye hesabınız — siparişler, Proje Fabrikası teklifleri, giriş ve güvenlik, teslimat.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://equsto.com/hesabim",
    languages: {
      tr: "https://equsto.com/hesabim",
      en: "https://equsto.com/en/account",
    },
  },
};

export default function HesabimPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-account">
      <MemberAccountHub />
    </VitrinShell>
  );
}
