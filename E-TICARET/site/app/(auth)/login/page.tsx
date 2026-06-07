import type { Metadata } from "next";
import Script from "next/script";
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

function resolveGoogleClientId(): string {
  return (
    process.env.EQUSTO_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

export default function LoginPage() {
  const googleClientId = resolveGoogleClientId();

  return (
    <>
      <link rel="preconnect" href="https://accounts.google.com" />
      <link rel="preconnect" href="https://oauth2.googleapis.com" crossOrigin="anonymous" />
      {googleClientId ? (
        <Script
          id="auth-google-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.EQUSTO_AUTH=window.EQUSTO_AUTH||{};window.EQUSTO_AUTH.googleClientId=${JSON.stringify(googleClientId)};`,
          }}
        />
      ) : null}
      <Script
        id="gsi-client"
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <RawLegacyPage
        bodyClass="eq-shop eq-auth"
        bodyHtml={LoginBodyHtml}
        extraStyles={[`/theme.css?v=${v}`, `/auth.css?v=${v}`]}
        scripts={[
          `/eq-i18n.js?v=${v}`,
          `/eq-site-urls.js?v=${v}`,
          `/equsto-logo.js?v=${v}`,
          `/equsto-member.js?v=${v}`,
          `/eq-auth-api.js`,
          `/equsto-auth-client.js?v=${v}`,
          ...LOGIN_SCRIPTS,
        ]}
      />
    </>
  );
}
