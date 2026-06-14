import Script from "next/script";

const ga4 = process.env.NEXT_PUBLIC_GA4_ID?.trim() || "";
const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";
const labelLead = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_LEAD?.trim() || "";
const labelQuote = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_QUOTE?.trim() || "";
const labelOrder = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_ORDER?.trim() || "";

/** GA4 + Google Ads (gtag) — env doluysa tüm sitede yüklenir */
export default function AnalyticsScripts() {
  if (!ga4 && !adsId) return null;

  const config = `
    window.EQUSTO_GA4_ID=${JSON.stringify(ga4)};
    window.EQUSTO_GOOGLE_ADS_ID=${JSON.stringify(adsId)};
    window.EQUSTO_ADS_CONVERSION_LABELS={
      lead: ${JSON.stringify(labelLead)},
      quote: ${JSON.stringify(labelQuote)},
      order: ${JSON.stringify(labelOrder)}
    };
  `;

  return (
    <>
      <Script id="eq-analytics-config" strategy="beforeInteractive">
        {config}
      </Script>
      <Script src="/eq-analytics.js" strategy="afterInteractive" />
    </>
  );
}
