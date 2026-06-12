import type { Metadata } from "next";
import { BesosBarIstasyonlariContent } from "../page";

export const metadata: Metadata = {
  title: "Bar İstasyonları · Besos Bar Design Studio",
  description:
    "Manhattan, Boulverdier, Clover imza barları ve 42 modüllük bar katalog. Modüler bar istasyonları — kuruluma hazır, özelleştirilebilir sistem.",
  alternates: { canonical: "https://equsto.com/besos/bar-istasyonlari" },
};

export default async function BesosBarIstasyonlariPage() {
  return <BesosBarIstasyonlariContent locale="tr" />;
}
