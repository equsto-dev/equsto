import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Equsto Yönetim",
  robots: { index: false, follow: false },
};

/** /yonetim → admin.html (giris hariç ayrı layout) */
export default function YonetimRootLayout({ children }: { children: ReactNode }) {
  return children;
}
