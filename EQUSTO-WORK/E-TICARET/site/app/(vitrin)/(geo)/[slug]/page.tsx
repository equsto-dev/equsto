import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeoLandingPage from "@/components/vitrin/GeoLandingPage";
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
  return {
    title: `${slug.replace(/-/g, " ")} · Equsto`,
    alternates: { canonical: `https://equsto.com/${slug}` },
  };
}

export default async function GeoTrSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GEO_TR_SLUGS.includes(slug as (typeof GEO_TR_SLUGS)[number])) notFound();
  return <GeoLandingPage />;
}
