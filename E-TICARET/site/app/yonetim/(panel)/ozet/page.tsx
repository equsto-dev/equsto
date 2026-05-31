import { redirect } from "next/navigation";

export default function YonetimOzetRedirectPage() {
  redirect("/yonetim/eticaret?tab=ozet");
}
