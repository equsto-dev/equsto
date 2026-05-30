import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeoLandingPage from "@/components/vitrin/GeoLandingPage";
import { GEO_EN_SLUGS } from "@/lib/vitrin/geo-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return GEO_EN_SLUGS.map((slug) => ({ slug }));
}

export default async function GeoEnSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GEO_EN_SLUGS.includes(slug as (typeof GEO_EN_SLUGS)[number])) notFound();
  return <GeoLandingPage />;
}

export const metadata: Metadata = {
  title: "Equsto",
};
