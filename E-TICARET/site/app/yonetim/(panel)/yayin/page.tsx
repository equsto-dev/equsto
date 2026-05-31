import { redirect } from "next/navigation";

export default function YonetimYayinRedirectPage() {
  redirect("/yonetim/eticaret?tab=yayin");
}
