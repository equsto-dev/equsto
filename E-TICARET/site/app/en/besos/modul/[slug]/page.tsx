import type { Metadata } from "next";
import {
  besosToSsr,
  buildBesosModulMetadata,
  findBesosModul,
} from "@/lib/besos/modul-pdp-server";
import { renderBesosModulPage } from "@/lib/besos/render-modul-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await findBesosModul(slug);
  if (!product) {
    return { title: "Module not found · Besos · Equsto", robots: { index: false } };
  }
  return buildBesosModulMetadata(besosToSsr(product, "en"));
}

export default async function BesosModulProductPageEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderBesosModulPage(slug, "en");
}
