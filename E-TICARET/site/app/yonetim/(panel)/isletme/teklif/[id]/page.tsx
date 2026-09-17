"use client";

import { useParams } from "next/navigation";
import IsletmeTeklifCalismaSayfasi from "@/components/pro/isletme/IsletmeTeklifCalismaSayfasi";

export default function YonetimTeklifCalismaPage() {
  const params = useParams();
  const id = String(params?.id ?? "").trim();
  if (!id) return null;
  return <IsletmeTeklifCalismaSayfasi teklifId={id} />;
}
