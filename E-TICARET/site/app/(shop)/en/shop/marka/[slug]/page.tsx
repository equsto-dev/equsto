import type { Metadata } from "next";
import {
  buildMarkaMetadata,
  MarkaSlugPageInner,
} from "../../../../shop/marka/[slug]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return buildMarkaMetadata(await params, "en");
}

export default async function MarkaEnSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MarkaSlugPageInner slug={slug} lang="en" />;
}
