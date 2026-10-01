import type { Metadata } from "next";
import BankaBilgileriPage from "../../banka-bilgileri/page";

export const metadata: Metadata = {
  title: "Our Bank Details · Equsto",
  description:
    "Equsto payment account details: QNB Finans Bank TL and USD IBANs and SWIFT code. Add your order number to your transfer description.",
  alternates: {
    canonical: "https://equsto.com/en/bank-details",
    languages: { tr: "https://equsto.com/banka-bilgileri", en: "https://equsto.com/en/bank-details" },
  },
};

export default BankaBilgileriPage;
