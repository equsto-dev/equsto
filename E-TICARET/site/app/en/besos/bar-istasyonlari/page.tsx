import type { Metadata } from "next";
import { BesosBarIstasyonlariContent } from "../../../besos/page";

export const metadata: Metadata = {
  title: "Bar Stations · Besos Bar Design Studio",
  description:
    "Manhattan, Boulverdier, Clover signature bars and a 42-module bar catalogue. Modular bar stations — ready to install, endlessly customisable.",
  alternates: { canonical: "https://equsto.com/en/besos/bar-istasyonlari" },
};

export default async function BesosBarIstasyonlariEnPage() {
  return <BesosBarIstasyonlariContent locale="en" />;
}
