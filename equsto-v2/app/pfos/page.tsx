import type { Metadata } from "next";
import PfosEqustoChrome from "@/components/pfos/public/PfosEqustoChrome";
import PfosPublicWizard from "@/components/pfos/public/PfosPublicWizard";
import type { WizardQuestion } from "@/lib/pfos/wizard/public-flow";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";
import styles from "@/components/pfos/public/pfos-public.module.css";

export const metadata: Metadata = {
  title: "Proje Fabrikası — Online Endüstriyel Mutfak Teklifi · Equsto",
  description:
    "Restoran, kafe ve bulut mutfak projeleri için sorulara cevap verin, ekipman listesi ve tahmini teklifi alın.",
  alternates: { canonical: "https://equsto.com/pfos" },
};

export default function PfosPage() {
  return (
    <div className={`${styles.pfosPage} eq-pfos-public-root`}>
      <PfosEqustoChrome />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>Proje Fabrikası</h1>
          <p>
            Soruları yukarıdan aşağıya sırayla yanıtlayın — her adım yeni bir kutu
            açar; tamamladıklarınız üstte özet olarak kalır.
          </p>
          <div className={styles.promoVideo} aria-label="PFOS tanıtım videosu">
            <div className={styles.promoVideoInner}>
              <strong>Tanıtım videosu</strong>
              <span>
                PFOS ekran kaydı, vitrin ve saha görüntüleri — video yayınlandığında
                bu alanda oynatılacak (YouTube chapter ile GEO).
              </span>
            </div>
          </div>
        </div>
        <PfosPublicWizard
          initialQuestions={DEFAULT_WIZARD_QUESTIONS as WizardQuestion[]}
        />
      </main>
      <footer className="footer" id="eq-shop-footer" />
      <p className={styles.footerNote}>
        © {new Date().getFullYear()} Equsto · Tahmini tutarlar bilgilendirme amaçlıdır.
      </p>
    </div>
  );
}
