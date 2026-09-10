import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  // Unox: katalogda gerçek brand değil (Öztiryakiler distribütörlüğü).
  // Brand hub oluşturulmaz; 404 dön.
  if (slug === "unox") notFound();
  return <MarkaSlugPageInner slug={slug} lang="en" />;
}
