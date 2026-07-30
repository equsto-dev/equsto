import { adminOk } from "@/lib/admin-response";
import {
  tepeplatformBaseUrl,
  tepeplatformConfigured,
} from "@/lib/odeme/tepeplatform";

export const dynamic = "force-dynamic";

/** Vitrin: kart ödemesi (TepePlatform) açık mı? */
export async function GET() {
  const enabled = tepeplatformConfigured();
  return adminOk({
    data: {
      enabled,
      gateway: enabled ? "tepeplatform" : null,
      partner: process.env.TEPEPLATFORM_PARTNER_SLUG || "equsto",
      baseUrl: enabled ? tepeplatformBaseUrl() : null,
      flow: "hosted_checkout",
    },
  });
}
