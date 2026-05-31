import type { Metadata } from "next";
import GeoLandingJsonLd from "@/components/seo/GeoLandingJsonLd";
import GeoLandingPage from "@/components/vitrin/GeoLandingPage";
import { buildGeoMetadata } from "@/lib/geo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildGeoMetadata(slug, "tr", "rehber");
}

export default async function RehberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <GeoLandingJsonLd slug={slug} lang="tr" kind="rehber" />
      <GeoLandingPage />
    </>
  );
}
