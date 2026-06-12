import type { Metadata } from "next";
import BesosUrbanBarSectionPage, {
  besosUrbanBarMetadata,
} from "@/components/besos/urbanbar/BesosUrbanBarSectionPage";

export const metadata: Metadata = besosUrbanBarMetadata("bar-ekipman", "tr");

export default function BesosBarEkipmanPage() {
  return <BesosUrbanBarSectionPage section="bar-ekipman" locale="tr" />;
}
