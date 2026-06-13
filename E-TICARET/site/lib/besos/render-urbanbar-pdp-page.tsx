import { notFound, redirect } from "next/navigation";
import BesosUrbanBarPdp, { buildUrbanBarPdpView } from "@/components/besos/urbanbar/BesosUrbanBarPdp";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import type { BesosLocale } from "@/lib/besos/locale";
import {
  besosUrbanBarProductSlug,
  type BesosUrbanBarSectionKey,
} from "@/lib/besos/urbanbar/catalog";
import {
  buildBesosUrbanBarJsonLd,
  loadBesosUrbanBarPdpBundle,
  urbanBarToPdpSsr,
} from "@/lib/besos/urbanbar/pdp-server";

export async function renderBesosUrbanBarPdpPage(
  sectionKey: BesosUrbanBarSectionKey,
  pathSlug: string,
  locale: BesosLocale = "tr",
) {
  const bundle = await loadBesosUrbanBarPdpBundle(sectionKey, pathSlug, locale);
  if (!bundle) notFound();

  const canonicalSlug = besosUrbanBarProductSlug(bundle.product);
  const normalizedPath = decodeURIComponent(pathSlug).toLowerCase().replace(/_/g, "-");
  const normalizedCanonical = canonicalSlug.toLowerCase().replace(/_/g, "-");
  if (normalizedPath !== normalizedCanonical) {
    const prefix = locale === "en" ? "/en/besos" : "/besos";
    const sec = sectionKey === "bardaklar" ? "bardaklar" : "bar-ekipman";
    redirect(`${prefix}/${sec}/${encodeURIComponent(canonicalSlug)}`);
  }

  const view = buildUrbanBarPdpView(bundle.product, sectionKey, locale);
  const ssr = urbanBarToPdpSsr(bundle.product, sectionKey, canonicalSlug, locale);
  const jsonLd = buildBesosUrbanBarJsonLd(ssr);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <BesosUrbanBarPdp view={view} />
      <ShopFooterHost />
    </>
  );
}
