import type { Metadata } from "next";
import type { BesosUrbanBarSectionKey } from "@/lib/besos/urbanbar/catalog";
import {
  buildBesosUrbanBarMetadata,
  loadBesosUrbanBarPdpBundle,
} from "@/lib/besos/urbanbar/pdp-server";
import { renderBesosUrbanBarPdpPage } from "@/lib/besos/render-urbanbar-pdp-page";

export const dynamic = "force-dynamic";

const SECTION: BesosUrbanBarSectionKey = "bar-ekipman";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadBesosUrbanBarPdpBundle(SECTION, slug, "en");
  if (!bundle) {
    return { title: "Product not found · Urban Bar · Besos", robots: { index: false } };
  }
  return buildBesosUrbanBarMetadata(bundle.ssr);
}

export default async function EnBesosBarEkipmanProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderBesosUrbanBarPdpPage(SECTION, slug, "en");
}
