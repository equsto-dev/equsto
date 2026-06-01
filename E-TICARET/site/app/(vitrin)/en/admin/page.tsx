import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin · Equsto",
  robots: { index: false, follow: false },
};

/** /en/admin → statik admin.html (TR ile aynı) */
export default function EnAdminPage() {
  redirect("/admin.html");
}
