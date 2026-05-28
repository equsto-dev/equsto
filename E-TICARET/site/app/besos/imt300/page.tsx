import type { Metadata } from "next";
import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { Imt300BodyHtml } from "@/lib/vitrin/bodies/imt300";
import { IMT300_SCRIPTS } from "@/lib/vitrin/legacy-scripts";

export const metadata: Metadata = {
  title: "IMT300 · Equsto Bar Design",
  alternates: { canonical: "https://equsto.com/besos/imt300" },
};

export default function Imt300Page() {
  return (
    <LegacyVitrinPage
      bodyClass="eq-shop eq-imt300"
      bodyHtml={Imt300BodyHtml}
      scripts={IMT300_SCRIPTS}
    />
  );
}
