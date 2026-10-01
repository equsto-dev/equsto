import type { Metadata } from "next";
import SartlarPage from "../../sartlar/page";

export const metadata: Metadata = {
  title: "Terms & Conditions · Equsto",
  description:
    "Equsto sales terms and conditions: quote validity, payment, delivery, installation and shipping. Identical to the terms applied in our written quotes.",
  alternates: {
    canonical: "https://equsto.com/en/terms",
    languages: { tr: "https://equsto.com/sartlar", en: "https://equsto.com/en/terms" },
  },
};

export default SartlarPage;
