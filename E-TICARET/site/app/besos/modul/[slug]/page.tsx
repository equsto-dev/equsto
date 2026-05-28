import LegacyVitrinPage from "@/components/vitrin/LegacyVitrinPage";
import { BarModuleBodyHtml } from "@/lib/vitrin/bodies/bar-module";
import { BAR_MODULE_SCRIPTS } from "@/lib/vitrin/legacy-scripts";

export default function BarModulePage() {
  return (
    <LegacyVitrinPage
      bodyClass="eq-shop eq-bar-module"
      bodyHtml={BarModuleBodyHtml.replace(/<header class="hdr"[\s\S]*?<\/header>\s*/i, "")}
      scripts={BAR_MODULE_SCRIPTS}
    />
  );
}
