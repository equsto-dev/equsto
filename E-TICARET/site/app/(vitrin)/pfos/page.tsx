import type { Metadata } from "next";
import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { PfosBodyHtml } from "@/lib/vitrin/bodies/pfos";
import { PFOS_SCRIPTS } from "@/lib/vitrin/legacy-scripts";

export const metadata: Metadata = {
  title: "Proje Fabrikası — Online Endüstriyel Mutfak Teklifi · Equsto",
  description: "Restoran, kafe, otel ve bulut mutfak projeleri için anında online mutfak ekipmanı teklifi.",
  alternates: {
    canonical: "https://equsto.com/pfos",
    languages: { tr: "https://equsto.com/pfos", en: "https://equsto.com/en/pfos" },
  },
};

const PFOS_CSS = `
body.eq-pfos .breadcrumb{display:none!important;}
`;

export default function PfosPage() {
  return (
    <LegacyVitrinPage
      bodyClass="eq-shop eq-pfos"
      bodyHtml={PfosBodyHtml}
      scripts={PFOS_SCRIPTS}
      extraCss={PFOS_CSS}
    />
  );
}
