import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeoLandingJsonLd from "@/components/seo/GeoLandingJsonLd";
import GeoLandingPage from "@/components/vitrin/GeoLandingPage";
import { buildGeoMetadata } from "@/lib/geo/metadata";
import { GEO_EN_SLUGS } from "@/lib/vitrin/geo-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return GEO_EN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildGeoMetadata(slug, "en", "root");
}

export default async function GeoEnSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!GEO_EN_SLUGS.includes(slug as (typeof GEO_EN_SLUGS)[number])) notFound();
  return (
    <>
      <GeoLandingJsonLd slug={slug} lang="en" kind="root" />
      <GeoLandingPage />
    </>
  );
}
