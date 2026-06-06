import Script from "next/script";

const ga4 = process.env.NEXT_PUBLIC_GA4_ID?.trim() || "";
const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";

/** GA4 + Google Ads (gtag) — env doluysa tüm sitede yüklenir */
export default function AnalyticsScripts() {
  if (!ga4 && !adsId) return null;

  const config = `window.EQUSTO_GA4_ID=${JSON.stringify(ga4)};window.EQUSTO_GOOGLE_ADS_ID=${JSON.stringify(adsId)};`;

  return (
    <>
      <Script id="eq-analytics-config" strategy="beforeInteractive">
        {config}
      </Script>
      <Script src="/eq-analytics.js" strategy="afterInteractive" />
    </>
  );
}
