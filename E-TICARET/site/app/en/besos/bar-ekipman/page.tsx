import type { Metadata } from "next";
import BesosUrbanBarSectionPage, {
  besosUrbanBarMetadata,
} from "@/components/besos/urbanbar/BesosUrbanBarSectionPage";

export const metadata: Metadata = besosUrbanBarMetadata("bar-ekipman", "en");

export default function EnBesosBarEkipmanPage() {
  return <BesosUrbanBarSectionPage section="bar-ekipman" locale="en" />;
}
