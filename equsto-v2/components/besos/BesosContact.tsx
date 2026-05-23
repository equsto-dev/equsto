import { BESOS_STUDIO } from "@/lib/besos/branding";
import Link from "next/link";

export default function BesosContact() {
  return (
  <>
    <section className="besos-foot" id="bd-foot" aria-label="Teklif">
      <div className="besos-foot-inner">
        <div className="besos-foot-kicker">Teklif</div>
        <h2 className="besos-foot-title">
          Vizyonunuzu hayata geçirmeye hazır mısınız?
          <br />
          <em>Bize ulaşın.</em>
        </h2>
        <p className="besos-foot-sub">
          Hazırsanız veya ek bilgi istiyorsanız — yardımcı olmak için buradayız.
        </p>
        <div className="besos-foot-cta">
          <Link className="bd-btn bd-btn-primary" href="/contact">
            İletişime geç
          </Link>
          <Link className="bd-btn" href="/pfos">
            Bar hattı teklifi al →
          </Link>
        </div>
      </div>
    </section>
    <div className="bd-powered">
      Powered By <strong>{BESOS_STUDIO}</strong> 2026
    </div>
  </>
  );
}
