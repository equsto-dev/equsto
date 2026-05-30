import type { Metadata } from "next";
import RawLegacyPage from "@/components/vitrin/RawLegacyPage";
import { AdminBodyHtml } from "@/lib/vitrin/bodies/admin";
import { ADMIN_SCRIPTS } from "@/lib/vitrin/legacy-scripts";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

export const metadata: Metadata = {
  title: "Admin · Equsto",
  robots: { index: false, follow: false },
};

const v = SHOP_ASSET_V;

export default function AdminPage() {
  return (
    <RawLegacyPage
      bodyClass="admin-app"
      bodyHtml={AdminBodyHtml}
      extraStyles={[`/theme.css?v=${v}`, `/admin.css?v=${v}`]}
      scripts={ADMIN_SCRIPTS}
    />
  );
}
