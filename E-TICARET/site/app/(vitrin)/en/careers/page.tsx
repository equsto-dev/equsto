import type { Metadata } from "next";
import KariyerPage from "../../kariyer/page";

export const metadata: Metadata = {
  title: "Careers · Equsto",
  description:
    "Careers at Equsto: sales engineering, project consultancy, catalogue, software and operations. Send your CV to info@equsto.com.",
  alternates: {
    canonical: "https://equsto.com/en/careers",
    languages: { tr: "https://equsto.com/kariyer", en: "https://equsto.com/en/careers" },
  },
};

export default KariyerPage;
