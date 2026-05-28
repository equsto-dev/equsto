import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { BarDesignBodyHtml } from "@/lib/vitrin/bodies/bar-design";
import { BAR_DESIGN_SCRIPTS } from "@/lib/vitrin/legacy-scripts";

export const metadata = {
  title: "Bar Design Studio · Besos · Equsto",
};

export default function EnBesosLegacyPage() {
  return (
    <LegacyVitrinPage
      bodyClass="eq-shop bd-page"
      bodyHtml={BarDesignBodyHtml}
      scripts={BAR_DESIGN_SCRIPTS}
    />
  );
}
