import { redirect } from "next/navigation";

/** Giriş sonrası varsayılan: sistem kontrolü */
export default function YonetimIndexPage() {
  redirect("/yonetim/kontrol");
}
