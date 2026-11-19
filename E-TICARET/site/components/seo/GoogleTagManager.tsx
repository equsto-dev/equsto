const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";

/**
 * AdresGezgini snippet'i: noscript + script, <body> açılışının hemen ardından.
 * Consent Mode bölgesel: EEA/UK/CH reddedilmiş, diğer ülkeler (TR dahil) kabul.
 * Kayıtlı seçim (equsto_cookie_consent) varsa o geçerli.
 */
export default function GoogleTagManager() {
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
      wait_for_update:500,
      region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH']
    });
    window.gtag('consent','default',{
      ad_storage:'granted',
      ad_user_data:'granted',
      ad_personalization:'granted',
      analytics_storage:'granted'
    });
    try{
      var eqConsent=localStorage.getItem('equsto_cookie_consent');
      if(eqConsent==='granted'||eqConsent==='denied'){
        var eqState=eqConsent==='granted'?'granted':'denied';
        window.gtag('consent','update',{
          ad_storage:eqState,
          ad_user_data:eqState,
          ad_personalization:eqState,
          analytics_storage:eqState
        });
      }
    }catch(e){}
    window.__eqConsentReady=true;
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
  `;

  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
          height={0}
          width={0}
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: boot }} />
    </>
  );
}
