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
        <h1>Buradan başladık</h1>
        <p className="hk-lead">
          Equsto, <strong>“tek listede ekipman + fiyat + proje”</strong> ihtiyacından doğdu. Önce yazılım ve katalog,
          sonra sahada mutfak ve bar projeleri.
        </p>
        <figure className="hk-media" id="eq-story-video-slot">
          <div className="hk-media__inner" role="img" aria-label="Tanıtım videosu yakında">
            <div>
              <strong style={{ display: "block", marginBottom: 8, color: "var(--eq-text)" }}>
                Kurumsal video — yakında
              </strong>
              PFOS · vitrin · Bar Design · saha toplantıları
            </div>
          </div>
        </figure>
        <h2>Hikaye özeti</h2>
        <ol className="hk-timeline">
          <li>
            <strong>Fikir</strong> — Restoran ve otel projelerinde Excel listeleri, dağınık bayi fiyatları ve geç dönen
            teklifler.
          </li>
          <li>
            <strong>Proje Fabrikası (PFOS)</strong> — Konsept, kapasite ve m² sorularına göre kural motoru; hedef{" "}
            <strong>5 dakika</strong>.
          </li>
          <li>
            <strong>E-ticaret vitrini</strong> — Pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanları.
          </li>
          <li>
            <strong>Bar Design Studio · Besos</strong> — Modüler bar ve IMT300 berrak buz hattı.
          </li>
        </ol>
        <div className="hk-actions">
          <a className="hk-a-primary" href="/pfos">
            Proje Fabrikası
          </a>
          <a className="hk-a-secondary" href="/hakkimizda">
            Hakkımızda
          </a>
          <a className="hk-a-secondary" href="/contact">
            İletişim
          </a>
        </div>
      </main>
    </VitrinShell>
  );
}
