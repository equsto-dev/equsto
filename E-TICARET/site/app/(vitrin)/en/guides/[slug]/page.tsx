import type { Metadata } from "next";
import GeoLandingRoute from "@/components/vitrin/GeoLandingRoute";
import { buildGeoMetadata } from "@/lib/geo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildGeoMetadata(slug, "en", "guides");
}

export default async function EnGuidesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GeoLandingRoute slug={slug} lang="en" kind="guides" />;
}
