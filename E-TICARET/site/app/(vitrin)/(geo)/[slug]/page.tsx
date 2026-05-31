import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeoLandingRoute from "@/components/vitrin/GeoLandingRoute";
import { buildGeoMetadata } from "@/lib/geo/metadata";
import { GEO_TR_SLUGS } from "@/lib/vitrin/geo-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return GEO_TR_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildGeoMetadata(slug, "tr", "root");
}

export default async function GeoTrSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!GEO_TR_SLUGS.includes(slug as (typeof GEO_TR_SLUGS)[number])) notFound();
  return <GeoLandingRoute slug={slug} lang="tr" kind="root" />;
}
