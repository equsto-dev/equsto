import type { Metadata } from "next";
import ContactPage from "../../contact/page";

export const metadata: Metadata = {
  title: "Contact & quote · Equsto",
  description:
    "Equsto sales engineering: quotes, PFOS and WhatsApp for restaurant, hotel, café and catering projects.",
  alternates: {
    canonical: "https://equsto.com/en/contact",
    languages: { tr: "https://equsto.com/contact", en: "https://equsto.com/en/contact" },
  },
};

export default ContactPage;
