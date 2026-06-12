import type { Metadata } from "next";
import Script from "next/script";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import Imt300BodyClass from "@/components/besos/Imt300BodyClass";
import { Imt300BodyHtml } from "@/lib/vitrin/bodies/imt300";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const metadata: Metadata = {
  title: "IMT300 · Equsto Bar Design",
  description:
    "Skyra IMT300 berrak buz makinesi: kesim gerektirmeden küp, küre, çubuk ve elmas buz üretimi. Bar, otel ve restoran için yerinde üretim.",
  alternates: { canonical: "https://equsto.com/besos/imt300" },
};

const v = SHOP_ASSET_V;

const IMT300_INTERACTIONS = `(function(){
  var m=document.getElementById('imt-hero-img');
  if(m){
    document.querySelectorAll('.imt-hero-thumbs button').forEach(function(b){
      b.addEventListener('click',function(){
        var s=b.getAttribute('data-src'); if(!s) return;
        m.src=s;
        document.querySelectorAll('.imt-hero-thumbs button').forEach(function(x){x.classList.toggle('on',x===b);});
      });
    });
  }
  var waBtn=document.getElementById('imt-wa-quote');
  if(waBtn){
    waBtn.addEventListener('click',function(){
      var msg='Merhaba, equsto.com üzerinden IMT300 Berrak Buz Makinesi için teklif almak istiyorum.\\n\\nÜrün: Skyra IMT300 Berrak Buz Makinesi (Çift Tepsi)\\nFiyat: 11.500 € + KDV\\n\\nDetaylı teklif, nakliye ve montaj planı rica ederim.';
      var phone=String(window.EQUSTO_WHATSAPP_E164||'').replace(/\\D/g,'');
      if(window.equstoOpenWhatsAppWebWindow&&phone){
        window.equstoOpenWhatsAppWebWindow(phone,msg);
        return;
      }
      if(typeof window.equstoOpenWhatsApp==='function'){
        window.EQUSTO_WHATSAPP_TEXT=msg;
        window.equstoOpenWhatsApp();
        return;
      }
      window.alert('WhatsApp bağlantısı şu an kullanılamıyor.');
    });
  }
})();`;

export default function Imt300Page() {
  return (
    <>
      <Script id="imt300-body-class-boot" strategy="beforeInteractive">
        {`(function(){try{document.body.classList.add("besos-sub","eq-imt-page");}catch(e){}})();`}
      </Script>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-imt300.css?v=${v}`} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-youtube-embed.css?v=${v}`} />
      <Imt300BodyClass />
      <div id="eq-legacy-vitrin-root" dangerouslySetInnerHTML={{ __html: Imt300BodyHtml }} />
      <ShopFooterHost />
      <Script src={`/eq-youtube-embed.js?v=${v}`} strategy="afterInteractive" />
      <Script id="imt300-interactions" strategy="afterInteractive">
        {IMT300_INTERACTIONS}
      </Script>
    </>
  );
}
