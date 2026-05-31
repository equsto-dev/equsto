import type { Metadata } from "next";
import GeoLandingRoute from "@/components/vitrin/GeoLandingRoute";
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
  return <GeoLandingRoute slug={slug} lang="tr" kind="rehber" />;
}
