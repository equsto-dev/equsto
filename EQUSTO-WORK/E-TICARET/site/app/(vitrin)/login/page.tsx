import type { Metadata } from "next";
import RawLegacyPage from "@/components/vitrin/RawLegacyPage";
import { LoginBodyHtml } from "@/lib/vitrin/bodies/login";
import { LOGIN_SCRIPTS } from "@/lib/vitrin/legacy-scripts";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const metadata: Metadata = {
  title: "Üye Girişi · Equsto",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://equsto.com/login",
    languages: { tr: "https://equsto.com/login", en: "https://equsto.com/en/login" },
  },
};

const v = SHOP_ASSET_V;

export default function LoginPage() {
  return (
    <RawLegacyPage
      bodyClass="eq-shop eq-auth"
      bodyHtml={LoginBodyHtml}
      withContactWidget
      extraStyles={[`/theme.css?v=${v}`, `/auth.css?v=${v}`]}
      scripts={[
        `/equsto-member.js?v=${v}`,
        `/eq-auth-api.js`,
        `/equsto-auth-client.js?v=${v}`,
        `/equsto-logo.js?v=${v}`,
        ...LOGIN_SCRIPTS,
      ]}
    />
  );
}
