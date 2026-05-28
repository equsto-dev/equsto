import type { Metadata } from "next";
import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { IndexBodyHtml } from "@/lib/vitrin/bodies/index";
import { HOME_EXTRA_STYLES, HOME_SCRIPTS } from "@/lib/vitrin/legacy-scripts";

export const metadata: Metadata = {
  title: "Equsto — Endüstriyel Mutfak ve Gastronomi Çözümleri",
  description:
    "Restoran, hotel, cafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları. Proje Fabrikası ile anında teklif.",
  alternates: {
    canonical: "https://equsto.com/",
    languages: { tr: "https://equsto.com/", en: "https://equsto.com/en/" },
  },
};

export default function HomePage() {
  return (
    <LegacyVitrinPage
      bodyClass="eq-shop eq-home eq-home-mutbex eq-home-decor"
      bodyHtml={IndexBodyHtml}
      scripts={HOME_SCRIPTS}
      headStyles={HOME_EXTRA_STYLES}
    />
  );
}
