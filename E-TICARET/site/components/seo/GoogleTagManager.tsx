import Script from "next/script";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";

/**
 * Google Tag Manager — resmi yerleşim:
 * 1) Script mümkün olduğunca yüksekte &lt;head&gt;
 * 2) noscript hemen &lt;body&gt; açılışından sonra
 * Consent Mode v2, GTM yüklenmeden önce default denied (veya kayıtlı granted → update).
 */
export function GoogleTagManagerHead() {
  if (!gtmId) return null;

  const boot = `
    window.dataLayer=window.dataLayer||[];
    function eqGtmGtag(){window.dataLayer.push(arguments);}
    window.gtag=window.gtag||eqGtmGtag;
    window.gtag('consent','default',{
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied',
      analytics_storage:'denied',
      wait_for_update:500
    });
    try{
      if(localStorage.getItem('equsto_cookie_consent')==='granted'){
        window.gtag('consent','update',{
          ad_storage:'granted',
          ad_user_data:'granted',
          ad_personalization:'granted',
          analytics_storage:'granted'
        });
      }
    }catch(e){}
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
  `;

  return (
    <Script id="google-tag-manager" strategy="beforeInteractive">
      {boot}
    </Script>
  );
}

/** Hemen &lt;body&gt; açılışından sonra — JS kapalıyken GTM */
export function GoogleTagManagerNoscript() {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
        height={0}
        width={0}
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
