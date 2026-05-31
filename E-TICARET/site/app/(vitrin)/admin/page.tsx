import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin · Equsto",
  robots: { index: false, follow: false },
};

/** Founder Decision Panel — tam statik admin.html (CSS + script dahil) */
export default function AdminPage() {
  redirect("/admin.html");
}
