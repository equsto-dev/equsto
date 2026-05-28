import type { Metadata } from "next";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { STORY_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Buradan başladık · Equsto",
  description: "Equsto kurumsal hikaye: Proje Fabrikası, e-ticaret vitrini ve Bar Design Studio.",
  alternates: {
    canonical: "https://equsto.com/buradan-basladi",
    languages: { tr: "https://equsto.com/buradan-basladi", en: "https://equsto.com/en/story" },
  },
};

export default function StoryPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-story" extraCss={STORY_PAGE_CSS}>
      <main className="hk-main" id="equsto-story">
        <h1 data-i18n="story.title">Buradan başladık</h1>
        <p className="hk-lead" data-i18n-html="story.lead_html">
          Equsto, <strong>“tek listede ekipman + fiyat + proje”</strong> ihtiyacından doğdu. Önce yazılım ve katalog,
          sonra sahada mutfak ve bar projeleri.
        </p>
        <figure className="hk-media" id="eq-story-video-slot">
          <div
            className="hk-media__inner"
            role="img"
            aria-label="Tanıtım videosu yakında"
            data-i18n-attr="aria-label:story.video_aria"
          >
            <div>
              <strong style={{ display: "block", marginBottom: 8, color: "var(--eq-text)" }} data-i18n="story.video_title">
                Kurumsal video — yakında
              </strong>
              <span data-i18n="story.video_sub">PFOS · vitrin · Bar Design · saha toplantıları</span>
            </div>
          </div>
        </figure>
        <h2 data-i18n="story.summary_h2">Hikaye özeti</h2>
        <ol className="hk-timeline">
          <li data-i18n="story.step_idea">
            <strong>Fikir</strong> — Restoran ve otel projelerinde Excel listeleri, dağınık bayi fiyatları ve geç dönen
            teklifler.
          </li>
          <li data-i18n="story.step_pfos">
            <strong>Proje Fabrikası (PFOS)</strong> — Konsept, kapasite ve m² sorularına göre kural motoru; hedef{" "}
            <strong>5 dakika</strong>.
          </li>
          <li data-i18n="story.step_shop">
            <strong>E-ticaret vitrini</strong> — Pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanları.
          </li>
          <li data-i18n="story.step_besos">
            <strong>Bar Design Studio · Besos</strong> — Modüler bar ve IMT300 berrak buz hattı.
          </li>
        </ol>
        <div className="hk-actions">
          <a className="hk-a-primary" href="/pfos" data-i18n="story.cta_pfos">
            Proje Fabrikası
          </a>
          <a className="hk-a-secondary" href="/hakkimizda" data-i18n="story.cta_about">
            Hakkımızda
          </a>
          <a className="hk-a-secondary" href="/contact" data-i18n="story.cta_contact">
            İletişim
          </a>
        </div>
      </main>
    </VitrinShell>
  );
}
